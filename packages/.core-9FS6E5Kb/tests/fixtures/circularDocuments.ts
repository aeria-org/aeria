import type { PackReferences, Token } from '@aeriajs/types'
import type { CircularA, CircularB } from './types.js'
import { throwIfError } from '@aeriajs/common'
import { createContext, insert } from '../../dist/index.js'
import { dbPromise } from './database.js'

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

  const { insertedIds: { '0': circularA1, '1': circularA3, '2': circularA4 } } = await db.collection<Omit<CircularA, '_id'>>('circularA').insertMany([
    { name: 'rec a1' },
    { name: 'rec a3' },
    { name: 'rec a4' },
  ])

  const { insertedId: circularB1 } = await db.collection<PackReferences<Omit<CircularB, '_id'>>>('circularB').insertOne({
    name: 'rec b1',
    circularA: circularA1,
  })

  const circularA2 = throwIfError(await insert({
    what: {
      name: 'rec a2',
      circularA: circularA1,
      circularB: circularB1,
      circularAs: [
        circularA3,
        circularA4,
      ],
      circularB_array: [circularB1],
    } satisfies PackReferences<Omit<CircularA, '_id'>>,
  }, circularAContext)) as CircularA

  return {
    circularA1,
    circularA2,
    circularA3,
    circularA4,
    circularB1,
  }
})()

