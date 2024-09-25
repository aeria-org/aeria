import type { Token } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { createContext, insert } from '../../dist/index.js'
import { dbPromise } from './database'

const token: Token = {
  authenticated: false,
  sub: null,
}

export const circularDocuments = (async () => {
  const { db } = await dbPromise
  if( !db ) {
    throw new Error
  }

  const circularAContext = await createContext({
    collectionName: 'circularA',
    token,
  })

  const { insertedId: circularA1 } = await db.collection('circulara').insertOne({
    name: 'rec a1',
  })

  const { insertedId: circularB1 } = await db.collection('circularb').insertOne({
    name: 'rec b1',
    circularA: circularA1,
  })

  const circularA2 = throwIfError(await insert({
    what: {
      name: 'rec a2',
      circularA: circularA1,
      circularB: circularB1,
      circularB_array: [
        circularB1,
      ],
    }
  }, circularAContext))

  return {
    circularA1,
    circularA2,
    circularB1,
  }
})()

