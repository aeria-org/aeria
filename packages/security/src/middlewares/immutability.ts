import type { Context, CollectionProps, What, CollectionReadPayload, CollectionWritePayload } from '@aeriajs/types'
import type { ReadMiddlewareReturn, WriteMiddlewareReturn } from '../types.js'
import { ObjectId } from 'mongodb'
import { Result, ACError } from '@aeriajs/types'

const checkImmutability = async <TPayload>(
  docId: What<unknown>['_id'],
  props: CollectionProps<TPayload>,
  context: Context,
) => {
  if( !context.description.immutable ) {
    return Result.result(props.payload)
  }

  if( docId ) {
    if( typeof context.description.immutable === 'function' ) {
      const doc = await context.collection.model.findOne({
        _id: new ObjectId(docId),
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

export const checkImmutabilityRead = async <T extends CollectionReadPayload>(
  props: Result.Result<CollectionProps<T>>,
  context: Context,
  next: (payload: typeof props, context: Context)=> ReadMiddlewareReturn<CollectionProps<T>>,
) => {
  const { payload: originalPayload } = props.result
  if( !(originalPayload.filters._id instanceof ObjectId) ) {
    throw new Error
  }

  const { result: payload, error } = await checkImmutability(originalPayload.filters._id, props.result, context)
  if( error ) {
    return Result.error(error)
  }

  return next(Result.result({
    ...props.result,
    payload,
  }), context)
}

export const checkImmutabilityWrite = async <T extends CollectionWritePayload>(
  props: Result.Result<CollectionProps<T>>,
  context: Context,
  next: (payload: typeof props, context: Context)=> WriteMiddlewareReturn<CollectionProps<T>>,
) => {
  const { payload: originalPayload } = props.result
  const { result: payload, error } = await checkImmutability(originalPayload.what._id, props.result, context)
  if( error ) {
    return Result.error(error)
  }

  return next(Result.result({
    ...props.result,
    payload,
  }), context)
}

