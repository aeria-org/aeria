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
  isArrayChild?: boolean
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

// const buildLookupStages = async (reference: Reference, propName: string, options: BuildLookupOptions) => {
//   const {
//     parent,
//     properties,
//     depth = 0,
//     maxDepth = 3,
//   } = options
//
//   const stages: any[] = []
//   let refHasDeepReferences = false
//
//   const withParent = (propName: string) => {
//     return parent
//       ? `${parent}.${propName}`
//       : propName
//   }
//
//   if( reference.referencedCollection ) {
//     if( !reference.populatedProperties ) {
//       stages.push({
//         $lookup: {
//           from: prepareCollectionName(reference.referencedCollection),
//           foreignField: '_id',
//           localField: withParent(propName),
//           as: withParent(propName),
//         },
//       })
//
//     } else {
//       const subPipeline: any[] = []
//       if( reference.deepReferences ) {
//         const subProperties = throwIfError(await getCollectionAsset(reference.referencedCollection, 'description')).properties
//         subPipeline.push(...await buildLookupPipeline(reference.deepReferences, {
//           project: reference.populatedProperties,
//           properties: subProperties,
//         }))
//       }
//
//       if( reference.populatedProperties.length > 0 ) {
//         subPipeline.push({
//           $project: Object.fromEntries(reference.populatedProperties.map((index) => [
//             index,
//             1,
//           ])),
//         })
//       }
//
//       stages.push({
//         $lookup: {
//           from: prepareCollectionName(reference.referencedCollection),
//           let: {
//             'ids': !reference.isArray
//               ? `$${withParent(propName)}`
//               : {
//                 $ifNull: [
//                   `$${withParent(propName)}`,
//                   [],
//                 ],
//               },
//           },
//           as: withParent(propName),
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   [
//                   reference.isArray
//                     ? '$in'
//                     : '$eq'
//                   ]: [
//                     '$_id',
//                     '$$ids',
//                   ],
//                 },
//               },
//             },
//             ...subPipeline,
//           ],
//         },
//       })
//     }
//
//     if( !reference.isArray ) {
//       stages.push({
//         $unwind: {
//           path: `$${withParent(propName)}`,
//           preserveNullAndEmptyArrays: true,
//         },
//       })
//     }
//   } else if( reference.deepReferences && depth <= maxDepth ) {
//     refHasDeepReferences = true
//
//     if( reference.isArray ) {
//       stages.push({
//         $unwind: {
//           path: `$${withParent(propName)}`,
//           preserveNullAndEmptyArrays: true,
//         },
//       })
//     }
//
//     for( const [refName, refMap] of Object.entries(reference.deepReferences) ) {
//       if( !refMap ) {
//         continue
//       }
//
//       if( refMap.referencedCollection ) {
//         const description = throwIfError(await getCollectionAsset(refMap.referencedCollection, 'description'))
//         const { stages: result } = await buildLookupStages(refMap, refName, {
//           depth: depth + 1,
//           parent: withParent(propName),
//           properties: description.properties,
//         })
//
//         stages.push(...result)
//         continue
//       }
//
//       const refProperties = properties[propName]
//
//       if( 'properties' in refProperties ) {
//         const { stages: refStages } = await buildLookupStages(refMap, refName, {
//           depth: depth + 1,
//           parent: withParent(propName),
//           properties: refProperties.properties,
//         })
//
//         stages.push(...refStages)
//       } else if( 'items' in refProperties ) {
//         if( !('properties' in refProperties.items) ) {
//           throw new Error()
//         }
//
//         const { stages: refStages } = await buildLookupStages(refMap, refName, {
//           depth: depth + 1,
//           parent: withParent(propName),
//           properties: refProperties.items.properties,
//         })
//
//         stages.push(...refStages)
//       } else {
//         throw new Error()
//       }
//     }
//   }
//
//   return {
//     stages,
//     refHasDeepReferences,
//   }
// }
//
// export const buildLookupPipeline = async (referenceMap: ReferenceMap | {}, options: BuildLookupOptions): Promise<any[]> => {
//   const {
//     properties,
//     memoize: memoizeId,
//     project = [],
//   } = options
//
//   const memoize = `${memoizeId}-${project.sort().join('-')}`
//
//   if( memoizeId && lookupMemo[memoize] ) {
//     const result = lookupMemo[memoize]
//     return project.length > 0
//       ? narrowLookupPipelineProjection(result, project)
//       : result
//   }
//
//   let hasDeepReferences = false
//   const pipeline: any[] = []
//
//   for( const [propName, reference] of Object.entries(referenceMap) ) {
//     if( !reference ) {
//       continue
//     }
//
//     const {
//       stages,
//       refHasDeepReferences,
//     } = await buildLookupStages(reference, propName, options)
//
//     hasDeepReferences = hasDeepReferences || refHasDeepReferences
//     pipeline.push(...stages)
//   }
//
//   if( hasDeepReferences ) {
//     pipeline.push(buildGroupStages(referenceMap, properties))
//
//     const arrayCleanupStages = buildArrayCleanupStages(referenceMap)
//     if( arrayCleanupStages ) {
//       pipeline.push(arrayCleanupStages)
//     }
//   }
//
//   if( memoizeId ) {
//     lookupMemo[memoize] = pipeline
//   }
//
//   return project.length > 0
//     ? narrowLookupPipelineProjection(pipeline, project)
//     : pipeline
// }

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
        in: {
          $mergeObjects: [
            `$$${newElemName}`,
            recurseSetStage({
              ...reference,
              isArray: false,
            }, path, newElemName),
          ],
        },
      },
    }
  }

  if( reference.deepReferences ) {
    const stages: [string, PipelineStage][] = []

    for( const [subRefName, subReference] of Object.entries(reference.deepReferences) ) {
      if( !subReference ) {
        continue
      }

      const result = recurseSetStage(subReference, path.concat(subRefName), `${elemName}.${subRefName}`)

      if( subReference.deepReferences ) {
        if( subReference.referencedCollection ) {
          stages.push([
            subRefName,
            {
              $mergeObjects: [
                {
                  $arrayElemAt: [
                    `$${getTempName(path.concat(subRefName))}`,
                    {
                      $indexOfArray: [
                        `$${getTempName(path.concat(subRefName))}._id`,
                        `$$${elemName}.${subRefName}`,
                      ],
                    },
                  ],
                },
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
    ? `$${elemName}__elem`
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
      pipeline.push({
        $set: {
          [refName]: result,
        },
      })

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

      const result = recurseSetStage(reference, path.concat(refName))
      pipeline.push({
        $set: {
          [refName]: result,
        },
      })
    }
  }

  if( path.length === 0 ) {
    return rootPipeline.concat(pipeline, [
      {
        $unset: tempNames,
      },
    ])
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

