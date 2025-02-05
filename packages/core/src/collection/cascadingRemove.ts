import type { Context, RouteContext } from '@aeriajs/types'
import type * as functions from '../functions/index.js'
import { ObjectId } from 'mongodb'
import { createContext } from '../context.js'
import { getFunction } from '../assets.js'
import { getDatabaseCollection } from '../database.js'
import { getReferences, type ReferenceMap, type Reference } from './reference.js'

const internalCascadingRemove = async (target: Record<string, unknown>, refMap: ReferenceMap, context: RouteContext) => {
  for( const refName in refMap ) {
    const reference = refMap[refName]

    if( !target[refName] ) {
      continue
    }

    if( reference.referencedCollection ) {
      if( reference.isInline || reference.referencedCollection === 'file' ) {
        if( target[refName] instanceof ObjectId || Array.isArray(target[refName]) ) {
          await preferredRemove(target[refName], reference, context)
        }
      }
    } else if( reference.deepReferences ) {
      if( Array.isArray(target[refName]) ) {
        for( const elem of target[refName] ) {
          await internalCascadingRemove(elem, reference.deepReferences, context)
        }
        continue
      }

      await internalCascadingRemove(target[refName] as Record<string, unknown>, reference.deepReferences, context)
    }
  }
}

export const preferredRemove = async (targetId: ObjectId | (ObjectId | null)[], reference: Reference, parentContext: RouteContext) => {
  if( !reference.referencedCollection ) {
    return
  }

  const coll = getDatabaseCollection(reference.referencedCollection)
  const context = await createContext({
    parentContext,
    collectionName: reference.referencedCollection,
  })

  if( Array.isArray(targetId) ) {
    if( targetId.length === 0 ) {
      return
    }

    const nonNullable = targetId.filter((id) => !!id)
    const { result: removeAll } = await getFunction<typeof functions.removeAll>(reference.referencedCollection, 'removeAll')
    if( removeAll ) {
      return removeAll({
        filters: nonNullable,
      }, context)
    }

    return coll.deleteMany({
      _id: {
        $in: nonNullable,
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

export const cascadingRemove = async (target: Record<string, unknown>, context: Context) => {
  const refMap = await getReferences(context.description.properties)
  return internalCascadingRemove(target, refMap, context)
}

