import type { Collection } from '@aeriajs/types'
import { right } from '@aeriajs/common'
import { getDatabase, prepareCollectionName, getDatabaseCollection } from '@aeriajs/api'
import { config as loadEnv } from 'dotenv'
import { log } from './log.js'
import path from 'path'

export const migrate = async () => {
  if(
    process.env.GITHUB_ACTIONS
    || process.env.TRAVIS
    || process.env.CIRCLECI
    || process.env.GITLAB_CI
    || process.env.IS_CI
  ) {
    return right('skipping (continuos integration detected)')
  }

  if( process.env.NODE_ENV !== 'production' ) {
    loadEnv()
  }

  const collections = await import(path.join(process.cwd(), 'dist', 'collections')) as Record<string,
    | Collection
    | (()=> Collection)
  >

  const session = await getDatabase()

  const createCollection = async (name: string) => {
    if( !session.db ) {
      throw new Error()
    }

    const collectionName = prepareCollectionName(name)
    const collection = await session.db.listCollections({
      name: collectionName,
    }).next()

    if( !collection ) {
      await session.db.createCollection(collectionName)
    }
  }

  for( const collectionName in collections ) {
    const candidate = collections[collectionName ]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    const { description } = collection
    await createCollection(collectionName)

    if( description.search ) {
      const model = getDatabaseCollection(collectionName)
      const indexes = await model.indexes()
      const searchIndexes = description.search.indexes

      const textIndex = indexes.find((index) => 'textIndexVersion' in index)
      const invalidated = textIndex && !searchIndexes.every((key) => Object.keys(textIndex.weights).includes(key as string))

      if( !textIndex || invalidated ) {
        if( textIndex ) {
          await model.dropIndex(textIndex.name)
        }

        await model.createIndex(Object.fromEntries(searchIndexes.map((index) => [
          index,
          'text',
        ])))

        log('info', `new text index created for ${collectionName}`)
      }
    }

    if( description.indexes ) {
      const model = getDatabaseCollection(collectionName)
      const collIndexes = await model.indexes()

      let newIndexes = 0

      for( const index of description.indexes ) {
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

    if( description.temporary ) {
      const model = getDatabaseCollection(collectionName)
      const collIndexes = await model.indexes()

      const { index: temporaryIndex, expireAfterSeconds } = description.temporary

      const hasIndex = collIndexes.some((index) => {
        return temporaryIndex in index.key && 'expireAfterSeconds' in index
      })

      if( !hasIndex ) {
        await model.createIndex({
          [temporaryIndex]: 1,
        }, {
          expireAfterSeconds,
        })

        log('info', `temporary index created for ${collectionName}`)
      }
    }
  }

  await session.client.close()
  return right('migration succeeded')
}

