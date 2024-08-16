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

// export type BuildLookupOptions = {
//   properties: FixedObjectProperty['properties']
//   parent?: string
//   depth?: number
//   maxDepth?: number
//   memoize?: string
//   project?: string[]
// }

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
// const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>> | undefined> = {}

export const getReferences = async (properties: FixedObjectProperty['properties'], options?: GetReferenceOptions) => {
  const {
    depth = 0,
    maxDepth = 3,
    memoize,
  } = options || {}

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
    return {
      $map: {
        input: elemName
          ? `$$${elemName}`
          : `$${refName}`,
        as: newElemName,
        in: recurseSetStage({
          ...reference,
          isArray: false,
        }, path, newElemName),
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

      if( subReference.deepReferences ) {
        if( subReference.referencedCollection ) {
          stages.push([
            subRefName,
            {
              $mergeObjects: [
                recurseSetStage({
                  ...subReference,
                  deepReferences: undefined,
                }, path.concat(subRefName), elemName),
                result,
              ],
            },
          ])
          continue
        }
      }

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

  const originArray = elemName
    ? `$${elemName}`
    : undefined

  return {
    $arrayElemAt: [
      `$${getTempName(path)}`,
      {
        $indexOfArray: [
          `$${getTempName(path)}._id`,
          originArray
            ? `$${originArray}.${refName}`
            : `$${refName}`,
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
  } = options

  const pipeline: PipelineStage[] = []
  const setProperties: [string, any][] = []

  for( const [refName, reference] of Object.entries(refMap) ) {
    if( !reference ) {
      continue
    }

    if( reference.deepReferences ) {
      buildLookupPipeline(reference.deepReferences, {
        rootPipeline,
        tempNames,
        path: path.concat(refName),
      })

      const result = recurseSetStage(reference, path.concat(refName))
      setProperties.push([
        refName,
        result,
      ])
    }

    if( reference.referencedCollection ) {
      const tempName = getTempName(path.concat(refName))
      const lookupPipeline = []

      tempNames.unshift(tempName)

      if( reference.populatedProperties ) {
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
        const result = recurseSetStage(reference, path.concat(refName))
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
    console.log(JSON.stringify(refMap, null, 2))
    console.log(JSON.stringify(rootPipeline.concat(pipeline), null, 2))
    return rootPipeline.concat(pipeline)
  }

  return pipeline
}

export const getLookupPipeline = async (
  description: Description,
  _options?: Omit<BuildLookupPipelineOptions, 'properties'>,
) => {
  const options = Object.assign(_options || {}, {
    properties: description.properties,
  })

  const refMap = await getReferences(description.properties)
  return buildLookupPipeline(refMap, options)
}

const refMap = {
  // "user": {
  //   "deepReferences": {
  //     "picture_file": {
  //       "populatedProperties": [
  //         "name",
  //         "link",
  //         "type"
  //       ],
  //       "isChild": true,
  //       "referencedCollection": "file"
  //     }
  //   },
  //   "populatedProperties": [
  //     "name",
  //     "name",
  //     "document",
  //     "picture_file"
  //   ],
  //   "referencedCollection": "user"
  // },
  'a': {
    'deepReferences': {
      'user': {
        'deepReferences': {
          'picture_file': {
            'populatedProperties': [
              'name',
              'link',
              'type',
            ],
            'isChild': true,
            'referencedCollection': 'file',
          },
        },
        'populatedProperties': [
          'name',
          'name',
          'document',
          'picture_file',
        ],
        'referencedCollection': 'user',
      },
    },
  },
  // "files": {
  //   "populatedProperties": [
  //     "name",
  //     "link",
  //     "type"
  //   ],
  //   "isArray": true,
  //   "referencedCollection": "file"
  // },
  // "array": {
  //   "deepReferences": {
  //     "nested": {
  //       "deepReferences": {
  //         "users": {
  //           "deepReferences": {
  //             "user": {
  //               "deepReferences": {
  //                 "picture_file": {
  //                   "populatedProperties": [
  //                     "name",
  //                     "link",
  //                     "type"
  //                   ],
  //                   "isChild": true,
  //                   "referencedCollection": "file"
  //                 }
  //               },
  //               "populatedProperties": [
  //                 "name",
  //                 "name",
  //                 "document",
  //                 "picture_file"
  //               ],
  //               "referencedCollection": "user"
  //             }
  //           },
  //           "isArray": true
  //         }
  //       }
  //     }
  //   },
  //   "isArray": true
  // }
}

console.log(JSON.stringify(buildLookupPipeline(refMap), null, 2))

