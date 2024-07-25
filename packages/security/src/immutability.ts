import type { ObjectId } from 'mongodb'
import type { Context, CollectionHookProps } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'

const checkImmutability = async <TProps extends CollectionHookProps>(
  docId: ObjectId | undefined,
  props: TProps,
  context: Context,
) => {
  if( !context.description.immutable ) {
    return Result.result(props.payload)
  }

  if( docId ) {
    if( typeof context.description.immutable === 'function' ) {
      const doc = await context.collection.model.findOne({
        _id: docId,
      })

      if( !doc ) {
        return Result.error(ACError.ResourceNotFound)
      }

      const isImmutable = await context.description.immutable(doc)
      return isImmutable
        ? Result.error(ACError.TargetImmutable)
        : Result.result(props.payload)
    }

    return Result.error(ACError.TargetImmutable)
  }

  return Result.result(props.payload)
}

export const checkImmutabilityRead = async (props: CollectionHookProps<CollectionHookReadPayload>, context: Context) => {
  return checkImmutability(props.payload.filters._id, props, context)
}

export const checkImmutabilityWrite = async (props: CollectionHookProps<CollectionHookWritePayload>, context: Context) => {
  return checkImmutability(props.payload.what._id, props, context)
}

