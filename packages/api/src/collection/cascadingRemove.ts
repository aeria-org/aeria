import type { Context } from '@aeriajs/types'
import type { ObjectId } from 'mongodb'
import { isRight, unwrapEither } from '@aeriajs/common'
import { createContext } from '../context.js'
import { getFunction } from '../assets.js'
import { getDatabaseCollection } from '../database.js'
import { getReferences, type ReferenceMap, type Reference } from './reference.js'

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
    const removeAllEither = await getFunction(reference.referencedCollection, 'removeAll')
    if( isRight(removeAllEither) ) {
      const removeAll = unwrapEither(removeAllEither)
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

  const removeEither = await getFunction(reference.referencedCollection, 'remove')
  if( isRight(removeEither) ) {
    const remove = unwrapEither(removeEither)
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

const internalCascadingRemove = async (target: Record<string, any>, refMap: ReferenceMap, context: Context) => {
  for( const refName in refMap ) {
    const reference = refMap[refName]

    if( !reference || !target[refName] ) {
      continue
    }

    if( reference.isInline || reference.referencedCollection === 'file' ) {
      await preferredRemove(target[refName], reference, context)
    }

    if( reference.deepReferences ) {
      if( Array.isArray(target[refName]) ) {
        for( const elem of target[refName] ) {
          await internalCascadingRemove(elem, reference.deepReferences, context)
        }
        continue
      }

      await internalCascadingRemove(target[refName], reference.deepReferences, context)
    }
  }
}

export const cascadingRemove = async (target: Record<string, any>, context: Context) => {
  const refMap = await getReferences(context.description.properties)
  return internalCascadingRemove(target, refMap, context)
}

