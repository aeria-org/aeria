import type { FixedObjectProperty, Description } from '@aeriajs/types'
import { throwIfError, getReferenceProperty } from '@aeriajs/common'
import { getCollectionAsset } from '../assets.js'
import { prepareCollectionName } from '../database.js'

export type GetReferenceOptions = {
  memoize?: string
  depth?: number
  maxDepth?: number
}

export type Reference = {
  isArray?: boolean
  isInline?: boolean
  isChild?: boolean
  deepReferences?: ReferenceMap
  referencedCollection?: string
  populatedProperties?: string[]
}

export type ReferenceMap = Record<string, Reference | undefined>

export type PipelineStage = any

export type BuildLookupPipelineOptions = {
  rootPipeline?: PipelineStage[]
  path?: string[]
  tempNames?: string[]
  memoize?: string
  project?: string[]
}

const getTempName = (path: string[]) => {
  return `_${path.join('_')}`
}

const referenceMemo: Record<string, ReferenceMap | {} | undefined> = {}
const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>> | undefined> = {}

export const getReferences = async (properties: FixedObjectProperty['properties'], options: GetReferenceOptions = {}) => {
  const {
    depth = 0,
    maxDepth = 3,
    memoize,
  } = options

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]
    }
  }

  const refMap: ReferenceMap = {}

  for( const [propName, property] of Object.entries(properties) ) {
    const refProperty = getReferenceProperty(property)
    const reference: Reference = {}

    if( depth === maxDepth || (refProperty && refProperty.populate && refProperty.populate.length === 0) ) {
      continue
    }

    if( refProperty ) {
      const description = throwIfError(await getCollectionAsset(refProperty.$ref, 'description'))

      const deepReferences = await getReferences(description.properties, {
        depth: depth + 1,
        maxDepth: refProperty.populateDepth || maxDepth,
        memoize: `${memoize}.${propName}`,
      })

      if( Object.keys(deepReferences).length > 0 ) {
        reference.deepReferences = deepReferences
      }

      const indexes = refProperty.indexes
        ? refProperty.indexes
        : description.indexes || []

      reference.populatedProperties = (refProperty.populate || []).concat(indexes.filter((index): index is string => typeof index === 'string'))

    } else {
      const entrypoint = 'items' in property
        ? property.items
        : property

      // if( property.additionalProperties ) {
      //   deepReferences[propName] = getReferences(propName, property.additionalProperties, {
      //     memoize: false
      //   })
      // }

      if( 'properties' in entrypoint ) {
        const deepReferences = await getReferences(entrypoint.properties, {
          memoize: `${memoize}.${propName}`,
        })

        if( Object.keys(deepReferences).length > 0 ) {
          reference.deepReferences ??= {}
          reference.deepReferences = deepReferences
        }
      }

    }

    if( !refProperty?.$ref && !reference.deepReferences ) {
      continue
    }

    if( 'items' in property ) {
      reference.isArray = true
    }

    if( depth > 0 ) {
      reference.isChild = true
    }

    if( refProperty ) {
      if( refProperty.$ref ) {
        reference.referencedCollection = refProperty.$ref
      }
      if( refProperty.inline ) {
        reference.isInline = true
      }
    }

    refMap[propName] = reference
  }

  if( memoize ) {
    referenceMemo[memoize] = refMap
  }

  return refMap
}

export const recurseSetStage = (reference: Reference, path: string[], elemName?: string): PipelineStage => {
  const refName = path.at(-1)!

  if( reference.isArray ) {
    const newElemName = `${refName}__elem`

    if( !reference.referencedCollection ) {
      return {
        $map: {
          input: `$${elemName}`,
          as: newElemName,
          in: {
            $mergeObjects: [
              `$$${newElemName}`,
              recurseSetStage({
                ...reference,
                isArray: false,
              }, path, `$${newElemName}`),
            ],
          },
        },
      }
    }

    return {
      $map: {
        input: `$${elemName}`,
        as: newElemName,
        in: recurseSetStage({
          ...reference,
          isArray: false,
        }, path, `$${newElemName}`),
      },
    }
  }

  if( reference.deepReferences ) {
    const stages: [string, PipelineStage][] = []

    for( const [subRefName, subReference] of Object.entries(reference.deepReferences) ) {
      if( !subReference ) {
        continue
      }

      const newElemName = elemName
        ? `${elemName}.${subRefName}`
        : elemName

      const result = recurseSetStage(subReference, path.concat(subRefName), newElemName)

      stages.push([
        subRefName,
        result,
      ])
    }

    if( reference.referencedCollection ) {
      return {
        $mergeObjects: [
          recurseSetStage({
            ...reference,
            deepReferences: undefined,
          }, path, elemName),
          Object.fromEntries(stages),
        ],
      }
    }

    return Object.fromEntries(stages)
  }

  if( reference.isChild ) {
    return {
      $arrayElemAt: [
        `$${getTempName(path)}`,
        {
          $indexOfArray: [
            `$${getTempName(path)}._id`,
            `$${getTempName(path.slice(0, -1))}.${refName}`,
          ],
        },
      ],
    }
  }

  return {
    $arrayElemAt: [
      `$${getTempName(path)}`,
      {
        $indexOfArray: [
          `$${getTempName(path)}._id`,
          `$${elemName}`,
        ],
      },
    ],
  }
}

export const buildLookupPipeline = (refMap: ReferenceMap, options: BuildLookupPipelineOptions = {}): PipelineStage[] => {
  const {
    rootPipeline = [],
    path = [],
    tempNames = [],
    project,
    memoize: memoizeId,
  } = options

  const memoize = project
    ? `${memoizeId}-${project.sort().join('-')}`
    : memoizeId

  if( memoize ) {
    if( lookupMemo[memoize] ) {
      return lookupMemo[memoize]
    }
  }

  const pipeline: PipelineStage[] = []
  const setProperties: [string, any][] = []

  for( const [refName, reference] of Object.entries(refMap) ) {
    if( !reference ) {
      continue
    }

    if( project ) {
      if( !project.includes(refName) ) {
        continue
      }
    }

    if( reference.deepReferences ) {
      buildLookupPipeline(reference.deepReferences, {
        rootPipeline,
        tempNames,
        path: path.concat(refName),
      })

      const result = recurseSetStage(reference, path.concat(refName), refName)
      setProperties.push([
        refName,
        result,
      ])
    }

    if( reference.referencedCollection ) {
      const tempName = getTempName(path.concat(refName))
      const lookupPipeline = []

      tempNames.unshift(tempName)

      if( reference.populatedProperties && reference.populatedProperties.length > 0 ) {
        const lookupPopulate = reference.populatedProperties
        if( reference.deepReferences ) {
          lookupPopulate.push(...Object.keys(reference.deepReferences))
        }

        lookupPipeline.push({
          $project: Object.fromEntries(reference.populatedProperties.map((index) => [
            index,
            1,
          ])),
        })
      }

      const localField = reference.isChild
        ? `${getTempName(path)}.${refName}`
        : path.concat(refName).join('.')

      rootPipeline.unshift({
        $lookup: {
          from: prepareCollectionName(reference.referencedCollection),
          foreignField: '_id',
          localField,
          as: tempName,
          pipeline: lookupPipeline,
        },
      })

      if( !reference.deepReferences ) {
        const result = recurseSetStage(reference, path.concat(refName), refName)
        setProperties.push([
          refName,
          result,
        ])
      }
    }
  }

  if( path.length === 0 ) {
    if( setProperties.length > 0 ) {
      pipeline.push({
        $set: Object.fromEntries(setProperties),
      })
    }

    if( tempNames.length > 0 ) {
      pipeline.push({
        $unset: tempNames,
      })
    }

    const finalPipeline = rootPipeline.concat(pipeline)
    if( memoize ) {
      lookupMemo[memoize] = finalPipeline
    }

    return finalPipeline
  }

  return pipeline
}

export const getLookupPipeline = async (
  description: Description,
  options: BuildLookupPipelineOptions,
) => {
  const refMap = await getReferences(description.properties)
  return buildLookupPipeline(refMap, options)
}

