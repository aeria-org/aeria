import type { PackReferences } from '@aeriajs/types'
import { getConfig } from '@aeriajs/entrypoint'
import { inspect } from 'node:util'
import { MongoClient } from 'mongodb'
export {
  ObjectId,
} from 'mongodb'

const dbMemo = {} as {
  client: MongoClient
  db: ReturnType<MongoClient['db']> | undefined
}

export const getDatabase = async () => {
  if( !dbMemo.db ) {
    const config = await getConfig()

    const mongodbUri = await (async () => {
      const envUri = config.database?.mongodbUrl

      if( !envUri ) {
        console.warn("mongo URI wasn't supplied, fallbacking to memory storage (this means your data will only be alive during runtime)")

        const { MongoMemoryServer } = await import('mongodb-memory-server')

        const mongod = await MongoMemoryServer.create()
        return mongod.getUri()
      }

      return envUri
    })()

    const logQueries = config.database?.logQueries || process.env.NODE_ENV === 'debug'

    const client = new MongoClient(mongodbUri, {
      monitorCommands: logQueries,
    })

    if( logQueries ) {
      client.on('commandStarted', (event) => {
        console.debug(inspect(event, {
          colors: true,
          compact: false,
          depth: Infinity,
        }))
      })
    }

    dbMemo.client = client
    dbMemo.db = client.db()
  }

  return dbMemo
}

export const getDatabaseSync = () => {
  if( !dbMemo.db ) {
    throw new Error('getDatabaseSync() called with no active database -- make sure you call getDatabase() to instantiate the database first')
  }

  return dbMemo.db
}

export const getDatabaseCollection = <TDocument extends Record<string, unknown>>(collectionName: string) => {
  const db = getDatabaseSync()
  return db.collection<PackReferences<TDocument>>(collectionName)
}

