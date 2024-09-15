import type { Context } from '@aeriajs/types'
import type * as functions from '../functions/index.js'
import { ObjectId } from 'mongodb'
import { createContext } from '../context.js'
import { getFunction } from '../assets.js'
import { getDatabaseCollection } from '../database.js'
import { getReferences, type ReferenceMap, type Reference } from './reference.js'

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object'
}

const preferredRemove = async (targetId: ObjectId | ObjectId[], reference: Reference, parentContext: Context) => {
  if( !reference.referencedCollection ) {
    return
  }

  const coll = getDatabaseCollection(reference.referencedCollection)
  const context = await createContext({
    parentContext,
    collectionName: reference.referencedCollection,
  })

  if( Array.isArray(targetId) ) {
    const { result: removeAll } = await getFunction<typeof functions.removeAll>(reference.referencedCollection, 'removeAll')
    if( removeAll ) {
      return removeAll({
        filters: targetId,
      }, context)
    }

    return coll.deleteMany({
      _id: {
        $in: targetId,
      },
    })
  }

  const { result: remove } = await getFunction<typeof functions.remove>(reference.referencedCollection, 'remove')
  if( remove ) {
    return remove({
      filters: {
        _id: targetId,
      },
    }, context)
  }

  return coll.deleteOne({
    _id: targetId,
  })
}

const internalCascadingRemove = async (target: Record<string, unknown>, refMap: ReferenceMap, context: Context) => {
  for( const refName in refMap ) {
    const reference = refMap[refName]
    if( !target[refName] ) {
      continue
    }

    if( reference.isInline || reference.referencedCollection === 'file' ) {
      if( target[refName] instanceof ObjectId ) {
        await preferredRemove(target[refName], reference, context)
      }
    }

    if( reference.deepReferences ) {
      if( Array.isArray(target[refName]) ) {
        for( const elem of target[refName] ) {
          await internalCascadingRemove(elem, reference.deepReferences, context)
        }
        continue
      }

      if( isObject(target[refName]) ) {
        await internalCascadingRemove(target[refName], reference.deepReferences, context)
      }
    }
  }
}

export const cascadingRemove = async (target: Record<string, unknown>, context: Context) => {
  const refMap = await getReferences(context.description.properties)
  return internalCascadingRemove(target, refMap, context)
}

