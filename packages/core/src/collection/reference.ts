import type { FixedObjectProperty, Description } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { throwIfError, getReferenceProperty } from '@aeriajs/common'
import { getCollectionAsset } from '../assets.js'

export type Reference = {
  isArray?: boolean
  isArrayElement?: boolean
  isInline?: boolean
  isRecursive?: boolean
  deepReferences?: ReferenceMap
  referencedCollection?: string
  indexes?: string[]
  populate?: string[]
}

export type ReferenceMap = Record<string, Reference>

export type GetReferenceOptions = {
  memoize?: string
  depth?: number
  maxDepth?: number
  populate?: string[]
  isArrayElement?: boolean
}

export type BuildLookupPipelineOptions = {
  rootPipeline?: Document[]
  path?: PathSegment[]
  tempNames?: string[]
  memoize?: string
  project?: string[]
}

type PathSegment = [segment: string, isRef: boolean]

const getTempName = (path: PathSegment[]) => {
  return `_${path.map(([segment]) => segment).join('_')}`
}

const referenceMemo: Record<string, ReferenceMap | undefined> = {}
const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>> | undefined> = {}

export const getReferences = async (properties: FixedObjectProperty['properties'], options: GetReferenceOptions = {}) => {
  const {
    depth = 0,
    maxDepth = 3,
    memoize,
    populate,
    isArrayElement,
  } = options

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]
    }
  }

  const refMap: ReferenceMap = {}

  for( const [propName, property] of Object.entries(properties) ) {
    const reference: Reference = {}
    const refProperty = getReferenceProperty(property)

    if( depth === maxDepth || (populate && !populate.includes(propName)) ) {
      continue
    }

    if( refProperty ) {
      const description = throwIfError(await getCollectionAsset(refProperty.$ref, 'description'))

      if( refProperty.inline || refProperty.populate ) {
        if( refProperty.populate && refProperty.populate.length === 0 ) {
          continue
        }

        const deepReferences = await getReferences(description.properties, {
          depth: depth + 1,
          maxDepth: refProperty.populateDepth || maxDepth,
          memoize: `${memoize}.${propName}`,
          populate: refProperty.populate
            ? Array.from(refProperty.populate)
            : undefined,
          isArrayElement: 'items' in property,
        })

        if( Object.keys(deepReferences).length > 0 ) {
          reference.deepReferences = deepReferences
        }
      }

      const { indexes = description.indexes || [] } = refProperty
      reference.populate = (refProperty.populate || []).concat(indexes.filter((index) => typeof index === 'string'))

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

    if( !refProperty && !reference.deepReferences ) {
      continue
    }

    if( 'items' in property ) {
      reference.isArray = true
    }

    if( isArrayElement ) {
      reference.isArrayElement = true
    }

    if( depth > 0 ) {
      reference.isRecursive = true
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

export const recurseSetStage = (reference: Reference, path: PathSegment[], parentElem: {}, options = {
  noCond: false,
}): Document => {
  const [refName, isRef] = path.at(-1)!
  const shouldUseArrayIndex = reference.isRecursive && !(reference.isArrayElement && reference.isArray === false)

  let indexOfArray: {}
  if( shouldUseArrayIndex ) {
    if( isRef ) {
      indexOfArray = {
        $indexOfArray: [
          `$${getTempName(path)}._id`,
          {
            $arrayElemAt: [
              `$${getTempName(path.slice(0, -1))}.${refName}`,
              {
                $indexOfArray: [
                  `$${getTempName(path.slice(0, -1))}._id`,
                  parentElem,
                ],
              },
            ],
          },
        ],
      }
    } else {
      indexOfArray = {
        $indexOfArray: [
          `$${getTempName(path.slice(0, -1))}._id`,
          parentElem,
        ],
      }
    }

  } else {
    indexOfArray = {
      $indexOfArray: [
        `$${getTempName(path)}._id`,
        parentElem,
      ],
    }
  }

  if( reference.isArray ) {
    const newElemName = `${refName}__elem`

    let mapIn: {}
    if( reference.referencedCollection ) {
      mapIn = recurseSetStage({
        ...reference,
        isArray: false,
      }, path, `$$${newElemName}`)
    } else {
      mapIn = {
        $mergeObjects: [
          `$$${newElemName}`,
          recurseSetStage({
            ...reference,
            isArray: false,
          }, path, `$$${newElemName}`),
        ],
      }
    }

    let mapInput = parentElem
    if( reference.isRecursive ) {
      if( reference.isArrayElement ) {
        mapInput = {
          $arrayElemAt: [
            `$${getTempName(path.slice(0, -1))}.${refName}`,
            {
              $indexOfArray: [
                `$${getTempName(path.slice(0, -1))}._id`,
                parentElem,
              ],
            },
          ],
        }
      } else {
        mapInput = {
          $arrayElemAt: [
            `$${getTempName(path.slice(0, -1))}.${refName}`,
            indexOfArray,
          ],
        }
      }
    }

    return {
      $filter: {
        input: {
          $map: {
            input: mapInput,
            as: newElemName,
            in: mapIn,
          },
        },
        as: 'elem',
        cond: {
          $ne: [
            '$$elem',
            null,
          ],
        },
      },
    }
  }

  if( reference.deepReferences ) {
    const stages: Record<string, Document> = {}

    for( const [subRefName, subReference] of Object.entries(reference.deepReferences) ) {
      let newElem: {}
      if( shouldUseArrayIndex ) {
        if( isRef ) {
          newElem = {
            $arrayElemAt: [
              `$${getTempName(path.slice(0, -1))}.${refName}`,
              indexOfArray,
            ],
          }
        } else {
          newElem = {
            $arrayElemAt: [
              `$${getTempName(path.slice(0, -1))}.${refName}.${subRefName}`,
              indexOfArray,
            ],
          }
        }
      } else {
        newElem = reference.referencedCollection
          ? parentElem
          : `${parentElem}.${subRefName}`
      }

      const result = recurseSetStage(subReference, path.concat([
        [
          subRefName,
          'referencedCollection' in subReference,
        ],
      ]), newElem)

      stages[subRefName] = result
    }

    if( reference.referencedCollection ) {
      return {
        $cond: [
          {
            $ne: [
              indexOfArray,
              -1,
            ],
          },
          {
            $mergeObjects: [
              recurseSetStage({
                ...reference,
                deepReferences: undefined,
              }, path, parentElem, {
                noCond: true,
              }),
              stages,
            ],
          },
          null,
        ],
      }
    }

    return stages
  }

  const arrayElemAt = {
    $arrayElemAt: [
      `$${getTempName(path)}`,
      indexOfArray,
    ],
  }

  if( options.noCond ) {
    return arrayElemAt
  }

  return {
    $cond: [
      {
        $ne: [
          indexOfArray,
          -1,
        ],
      },
      arrayElemAt,
      null,
    ],
  }
}

export const buildLookupPipeline = (refMap: ReferenceMap, options: BuildLookupPipelineOptions = {}): Document[] => {
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

  const pipeline: Document[] = []
  const setProperties: Record<string, {}> = {}

  for( const [refName, reference] of Object.entries(refMap) ) {
    if( project ) {
      if( !project.includes(refName) ) {
        continue
      }
    }

    const newPath = path.concat([
      [
        refName,
        'referencedCollection' in reference,
      ],
    ])

    if( reference.deepReferences ) {
      buildLookupPipeline(reference.deepReferences, {
        rootPipeline,
        tempNames,
        path: newPath,
      })

      const result = recurseSetStage(reference, newPath, `$${refName}`)
      setProperties[refName] = result
    }

    if( reference.referencedCollection ) {
      const tempName = getTempName(newPath)
      const lookupPipeline = []

      tempNames.unshift(tempName)

      if( reference.populate && reference.populate.length > 0 ) {
        lookupPipeline.push({
          $project: Object.fromEntries(reference.populate.map((index) => [
            index,
            1,
          ])),
        })
      }

      let localField: string
      if( reference.isRecursive ) {
        localField = `${getTempName(path)}.${refName}`
      } else {
        const localFieldPath = newPath.map(([segment]) => segment).join('.')
        localField = path[0] && path[0][1]
          ? `_${localFieldPath}`
          : localFieldPath
      }

      rootPipeline.unshift({
        $lookup: {
          from: reference.referencedCollection,
          foreignField: '_id',
          localField,
          as: tempName,
          pipeline: lookupPipeline,
        },
      })

      if( !reference.deepReferences ) {
        const result = recurseSetStage(reference, newPath, `$${refName}`)
        setProperties[refName] = result
      }
    }
  }

  if( path.length === 0 ) {
    if( Object.keys(setProperties).length > 0 ) {
      pipeline.push({
        $set: setProperties,
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

export const getLookupPipeline = async (description: Description, options: BuildLookupPipelineOptions) => {
  const refMap = await getReferences(description.properties)
  return buildLookupPipeline(refMap, options)
}

