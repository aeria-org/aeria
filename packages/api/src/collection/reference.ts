import type { FixedObjectProperty, Description } from '@aeriajs/types'
import { unsafe, getReferenceProperty } from '@aeriajs/common'
import { getCollectionAsset } from '../assets.js'
import { prepareCollectionName } from '../database.js'

export type GetReferenceOptions = {
  memoize?: string
  depth?: number
}

export type Reference = {
  isArray?: boolean
  isInline?: boolean
  deepReferences?: ReferenceMap
  referencedCollection?: string
  populatedProperties?: string[]
}

export type ReferenceMap = Record<string, Reference | undefined>

export type BuildLookupOptions = {
  properties: FixedObjectProperty['properties']
  parent?: string
  depth?: number
  maxDepth?: number
  memoize?: string
  project?: string[]
}

const referenceMemo: Record<string, ReferenceMap | {} | undefined> = {}
const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>> | undefined> = {}

const narrowLookupPipelineProjection = (pipeline: Record<string, any>[], projection: string[]) => {
  const hasAny = (propName: string) => {
    return propName.includes('.') || projection.includes(propName)
  }

  return pipeline.filter((stage) => {
    if( stage.$lookup ) {
      return hasAny(stage.$lookup.as)
    }

    if( stage.$unwind ) {
      return hasAny(stage.$unwind.path.slice(1))
    }

    return true
  })
}

const buildGroupStages = (referenceMap: ReferenceMap, properties: FixedObjectProperty['properties']) => {
  const $group = Object.keys(properties).reduce((a, propName) => {
    const refMap = referenceMap[propName] || {}
    const groupType = !refMap.referencedCollection && refMap.isArray
      ? 'push'
      : 'first'

    return {
      ...a,
      [propName]: {
        [`$${groupType}`]: `$${propName}`,
      },
    }
  }, {
    _id: '$_id',
  })

  return {
    $group,
  }
}

const buildArrayCleanupStages = (referenceMap: ReferenceMap) => {
  const $set = Object.entries(referenceMap).reduce((a, [refName, refMap]) => {
    if( !refMap!.isArray || refMap!.referencedCollection ) {
      return a
    }

    return {
      ...a,
      [refName]: {
        $filter: {
          input: `$${refName}`,
          as: `${refName}_elem`,
          cond: {
            $ne: [
              `$$${refName}_elem`,
              {},
            ],
          },
        },
      },
    }
  }, {})

  return Object.keys($set).length > 0
    ? {
      $set,
    }
    : null
}

export const getReferences = async (properties: FixedObjectProperty['properties'], options?: GetReferenceOptions) => {
  const {
    depth = 0,
    memoize,
  } = options || {}

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]!
    }
  }

  const references: ReferenceMap = {}

  for( const [propName, property] of Object.entries(properties) ) {
    const refProperty = getReferenceProperty(property)
    const reference: Reference = {}

    if( depth === 2 || (refProperty && refProperty.populate && refProperty.populate.length === 0) ) {
      continue
    }

    if( !refProperty ) {
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
          depth: depth + 1,
          memoize: `${memoize}.${propName}`,
        })

        if( Object.keys(deepReferences).length > 0 ) {
          reference.deepReferences ??= {}
          reference.deepReferences = deepReferences
        }
      }

    } else {
      const description = unsafe(await getCollectionAsset(refProperty.$ref, 'description'))
      const deepReferences = await getReferences(description.properties, {
        depth: depth + 1,
        memoize: `${memoize}.${propName}`,
      })

      if( Object.keys(deepReferences).length > 0 ) {
        reference.deepReferences = deepReferences
      }

      const indexes = refProperty.indexes
        ? refProperty.indexes
        : description.indexes || []

      reference.populatedProperties = [
        ...indexes,
        ...refProperty.populate || [],
      ]
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

    references[propName] = reference
  }

  if( memoize ) {
    referenceMemo[memoize] = references
  }

  return references
}

const buildLookupStages = async (reference: Reference, propName: string, options: BuildLookupOptions) => {
  const {
    parent,
    properties,
    depth = 0,
    maxDepth = 3,
  } = options

  const stages: any[] = []
  let refHasDeepReferences = false

  const withParent = (propName: string) => {
    return parent
      ? `${parent}.${propName}`
      : propName
  }

  if( reference.referencedCollection ) {
    if( !reference.populatedProperties ) {
      stages.push({
        $lookup: {
          from: prepareCollectionName(reference.referencedCollection),
          foreignField: '_id',
          localField: withParent(propName),
          as: withParent(propName),
        },
      })

    } else {
      const subPipeline: any[] = []
      if( reference.deepReferences ) {
        const subProperties = unsafe(await getCollectionAsset(reference.referencedCollection, 'description')).properties
        subPipeline.push(...await buildLookupPipeline(reference.deepReferences, {
          project: reference.populatedProperties,
          properties: subProperties,
        }))
      }

      if( reference.populatedProperties.length > 0 ) {
        subPipeline.push({
          $project: Object.fromEntries(reference.populatedProperties.map((index) => [
            index,
            1,
          ])),
        })
      }

      stages.push({
        $lookup: {
          from: prepareCollectionName(reference.referencedCollection),
          let: {
            'ids': !reference.isArray
              ? `$${withParent(propName)}`
              : {
                $ifNull: [
                  `$${withParent(propName)}`,
                  [],
                ],
              },
          },
          as: withParent(propName),
          pipeline: [
            {
              $match: {
                $expr: {
                  [
                  reference.isArray
                    ? '$in'
                    : '$eq'
                  ]: [
                    '$_id',
                    '$$ids',
                  ],
                },
              },
            },
            ...subPipeline,
          ],
        },
      })
    }

    if( !reference.isArray ) {
      stages.push({
        $unwind: {
          path: `$${withParent(propName)}`,
          preserveNullAndEmptyArrays: true,
        },
      })
    }
  } else if( reference.deepReferences && depth <= maxDepth ) {
    refHasDeepReferences = true

    stages.push({
      $unwind: {
        path: `$${withParent(propName)}`,
        preserveNullAndEmptyArrays: true,
      },
    })

    for( const [refName, refMap] of Object.entries(reference.deepReferences) ) {
      if( !refMap ) {
        continue
      }

      if( refMap.referencedCollection ) {
        const description = unsafe(await getCollectionAsset(refMap.referencedCollection, 'description'))
        const { stages: result } = await buildLookupStages(refMap, refName, {
          depth: depth + 1,
          parent: withParent(propName),
          properties: description.properties,
        })

        stages.push(...result)
        continue
      }

      const refProperties = properties[propName]
      if( !('properties' in refProperties) ) {
        throw new Error()
      }

      const { stages: result } = await buildLookupStages(refMap, refName, {
        depth: depth + 1,
        parent: withParent(propName),
        properties: refProperties.properties,
      })

      stages.push(...result)
    }
  }

  return {
    stages,
    refHasDeepReferences,
  }
}

export const buildLookupPipeline = async (referenceMap: ReferenceMap | {}, options: BuildLookupOptions): Promise<any[]> => {
  const {
    properties,
    memoize: memoizeId,
    project = [],
  } = options

  const memoize = `${memoizeId}-${project.sort().join('-')}`

  if( memoizeId && lookupMemo[memoize] ) {
    const result = lookupMemo[memoize]!
    return project.length > 0
      ? narrowLookupPipelineProjection(result, project)
      : result
  }

  let hasDeepReferences = false

  const pipeline: any[] = []

  for( const [propName, reference] of Object.entries(referenceMap) ) {
    if( !reference ) {
      continue
    }

    const {
      stages,
      refHasDeepReferences,
    } = await buildLookupStages(reference, propName, options)

    hasDeepReferences = hasDeepReferences || refHasDeepReferences
    pipeline.push(...stages)
  }

  if( hasDeepReferences ) {
    pipeline.push(buildGroupStages(referenceMap, properties))

    const arrayCleanupStages = buildArrayCleanupStages(referenceMap)
    if( arrayCleanupStages ) {
      pipeline.push(arrayCleanupStages)
    }
  }

  if( memoizeId ) {
    lookupMemo[memoize] = pipeline
  }

  return project.length > 0
    ? narrowLookupPipelineProjection(pipeline, project)
    : pipeline
}

export const getLookupPipeline = (
  description: Description,
  _options?: Omit<BuildLookupOptions, 'properties'>,
) => {
  const options = Object.assign(_options || {}, {
    properties: description.properties,
  })

  const references = getReferences(description.properties)
  return buildLookupPipeline(references, options)
}

