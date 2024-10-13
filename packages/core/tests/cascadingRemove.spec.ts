import type { RouteContext } from '@aeriajs/types'
import { expect, test, beforeAll } from 'vitest'
import { throwIfError } from '@aeriajs/common'
import { createContext, ObjectId } from '../dist/index.js'
import { dbPromise } from './fixtures/database.js'
import { circularDocuments } from './fixtures/circularDocuments.js'

let context: RouteContext

beforeAll(async () => {
  await dbPromise
  context = await createContext({
    config: {
      security: {},
    },
  })
})

test('cleanupReferences() removes replaced inline reference', async () => {
  const { db } = await dbPromise
  const { circularA2, circularA1, circularB1 } = await circularDocuments

  if( !db ) {
    throw new Error
  }

  throwIfError(await context.collections.circularA.functions.insert({
    what: {
      _id: circularA2._id,
      circularB: null,
    }
  }))

  const a1 = await db.collection('circularA').findOne({
    _id: circularA1,
  })

  const b1 = await db.collection('circularB').findOne({
    _id: circularB1,
  })

  expect(circularA2.circularB._id).toBeInstanceOf(ObjectId)
  expect(a1).toBeNull()
  expect(b1).toBeNull()
})

test('cleanupReferences() removes replaced inline reference inside array', async () => {
  const { db } = await dbPromise
  const { circularA2, circularA3, circularA4 } = await circularDocuments

  if( !db ) {
    throw new Error
  }

  throwIfError(await context.collections.circularA.functions.insert({
    what: {
      _id: circularA2._id,
      circularAs: [
        circularA3,
      ],
    }
  }))

  const a3 = await db.collection('circularA').findOne({
    _id: circularA3,
  })

  const a4 = await db.collection('circularA').findOne({
    _id: circularA4,
  })

  expect(circularA2.circularB._id).toBeInstanceOf(ObjectId)
  expect(a3).toBeTruthy()
  expect(a4).toBeNull()
})

