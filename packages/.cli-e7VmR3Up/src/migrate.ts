import { getCollections } from '@aeriajs/entrypoint'
import { getDatabase, getDatabaseCollection, getReferences, type ReferenceMap } from '@aeriajs/core'
import { Result } from '@aeriajs/types'
import { isRunningOnCI } from './ci.js'
import { log } from './log.js'

const recurseReferences = (refMap: ReferenceMap, indexMap: Record<string, Set<string>>) => {
  for( const reference of Object.values(refMap) ) {
    const { referencedCollection: collectionName, indexes, deepReferences } = reference
    if( collectionName ) {
      if( indexes ) {
        const set = indexMap[collectionName] ??= new Set()
        indexes.forEach(set.add, set)
      }
      continue
    }

    if( deepReferences ) {
      return recurseReferences(deepReferences, indexMap)
    }
  }

  return indexMap
}

export const migrate = async () => {
  if( isRunningOnCI() ) {
    return Result.result('skipping (continuos integration detected)')
  }

  if( process.env.NODE_ENV !== 'production' ) {
    try {
      process.loadEnvFile()
    } catch( err ) {
    }
  }

  const collections = await getCollections()
  const session = await getDatabase()

  const createCollection = async (collectionName: string) => {
    if( !session.db ) {
      throw new Error()
    }

    const collection = await session.db.listCollections({
      name: collectionName,
    }).next()

    if( !collection ) {
      await session.db.createCollection(collectionName)
    }
  }

  let indexMap: Record<string, Set<string>> = {}

  for( const collectionName in collections ) {
    const candidate = collections[collectionName ]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    await createCollection(collectionName)

    const model = getDatabaseCollection(collectionName)
    const collIndexes = await model.indexes()

    const { description } = collection
    const refMap = await getReferences(description.properties)

    const newIndexes = {
      unique: new Map<string, boolean>(),
      temporary: new Map<string, number>(),
    }

    indexMap = recurseReferences(refMap, indexMap)

    if( description.search ) {
      const set = indexMap[collectionName] ??= new Set()
      description.search.indexes.forEach((index) => set.add(String(index)))
    }

    if( description.indexes ) {
      const set = indexMap[collectionName] ??= new Set()
      description.indexes.forEach((index) => set.add(String(index)))
    }

    if( description.unique ) {
      for( const propertyName of description.unique ) {
        newIndexes.unique.set(propertyName, true)
      }
    }

    if( description.temporary ) {
      const { index: temporaryIndex, expireAfterSeconds } = description.temporary
      newIndexes.temporary.set(temporaryIndex, expireAfterSeconds)
    }

    for( const propertyName of [
      ...newIndexes.temporary.keys(),
      ...newIndexes.unique.keys(),
    ] ) {
      const uniqueIndex = newIndexes.unique.get(propertyName)
      const temporaryIndex = newIndexes.temporary.get(propertyName)

      const existingIndex = collIndexes.find((index) => propertyName in index.key)

      if( existingIndex?.name ) {
        if( (uniqueIndex === undefined || existingIndex.unique) && (temporaryIndex === undefined || existingIndex.expireAfterSeconds === temporaryIndex) ) {
          continue
        }

        await model.dropIndex(existingIndex.name)
      }

      const indexOptions: Parameters<typeof model.createIndex>[1] = {}
      if( uniqueIndex ) {
        indexOptions.unique = true
      }
      if( typeof temporaryIndex === 'number' ) {
        indexOptions.expireAfterSeconds = temporaryIndex
      }

      await model.createIndex({
        [propertyName]: 1,
      }, indexOptions)

      log('info', `new index created for ${collectionName}.${propertyName}`)
    }
  }

  for( const [collectionName, indexesSet] of Object.entries(indexMap) ) {
    const model = getDatabaseCollection(collectionName)
    const collIndexes = await model.indexes()
    const indexes = Array.from(indexesSet)

    const textIndex = collIndexes.find((index) => 'textIndexVersion' in index)
    const invalidated = textIndex && !indexes.every((key) => Object.keys(textIndex.weights!).includes(key))

    if( !textIndex || invalidated ) {
      if( textIndex ) {
        await model.dropIndex(textIndex.name!)
      }

      await model.createIndex(Object.fromEntries(indexes.map((index) => [
        index,
        'text',
      ])))

      log('info', `new text index created for ${collectionName}`)
    }

    let newIndexes = 0
    for( const index of indexes ) {
      if( index === '_id' ) {
        continue
      }
      const hasIndex = collIndexes.find((collIndex) => (
        !('textIndexVersion' in collIndex)
        && Object.keys(collIndex.key).length === 1
        && index in collIndex.key
      ))

      if( !hasIndex ) {
        await model.createIndex({
          [index]: 1,
        })

        newIndexes++
      }
    }

    if( newIndexes ) {
      log('info', `${newIndexes} new indexes created for ${collectionName}`)
    }
  }

  await session.client.close()
  return Result.result('migration succeeded')
}

