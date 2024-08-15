import type { Reference, ReferenceMap } from './collection/reference.js'
import { prepareCollectionName } from './database'

const reference = {
  'array': {
    'deepReferences': {
      'nested': {
        'deepReferences': {
          'users': {
            'deepReferences': {
              'user': {
                'deepReferences': {
                  'picture_file': {
                    'populatedProperties': [
                      'name',
                      'link',
                      'type',
                    ],
                    'referencedCollection': 'file',
                    'isChild': true,
                  },
                },
                'populatedProperties': [
                  'document',
                  'name',
                  'name',
                ],
                'referencedCollection': 'user',
              },
            },
            'isArray': true,
          },
        },
      },
    },
    'isArray': true,
  },
}

type PipelineStage = any

type BuildLookupPipeline = {
  rootPipeline?: PipelineStage[]
  path?: string[]
  tempNames?: string[]
}

const getTempName = (path: string[]) => {
  return `_${path.join('_')}`
}

const recurseSetStage = (reference: Reference, path: string[], elemName?: string): PipelineStage => {
  const refName = path.at(-1)!

  if( reference.isArray ) {
    const newElemName = `${refName}__elem`
    const { isArray, ...ref } = reference

    return {
      $map: {
        input: elemName
          ? `$$${elemName}`
          : `$${refName}`,
        as: newElemName,
        in: {
          $mergeObjects: [
            `$$${newElemName}`,
            recurseSetStage(ref, path, newElemName),
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
                      `$${getTempName(path.concat(subRefName))}`,
                      `$$${elemName}.${subRefName}`,
                    ],
                  },
                ],
              },
              recurseSetStage(subReference, path.concat(subRefName), `${elemName}.${subRefName}`),
            ],
          },
        ])
        continue
      }

      stages.push([
        subRefName,
        recurseSetStage(subReference, path.concat(subRefName), `${elemName}.${subRefName}`),
      ])
    }

    return Object.fromEntries(stages)
  }

  const parentName = path.at(-2)
  return {
    $arrayElemAt: [
      `$${getTempName(path)}`,
      {
        $indexOfArray: [
          `$${getTempName(path)}._id`,
          `$$${parentName}__elem.${refName}`,
        ],
      },
    ],
  }
}

const buildLookupPipeline = (refMap: ReferenceMap, options: BuildLookupPipeline = {}): PipelineStage[] => {
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
      tempNames.unshift(tempName)

      if( reference.isChild ) {
        rootPipeline.unshift({
          $lookup: {
            from: prepareCollectionName(reference.referencedCollection),
            foreignField: '_id',
            localField: `${getTempName(path)}.${refName}`,
            as: tempName,
          },
        })
      } else {
        rootPipeline.unshift({
          $lookup: {
            from: prepareCollectionName(reference.referencedCollection),
            foreignField: '_id',
            localField: path.concat(refName).join('.'),
            as: tempName,
          },
        })
      }

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

console.log(JSON.stringify(buildLookupPipeline(reference), null, 2))
