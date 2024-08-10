import type { ObjectId } from 'mongodb'
import type { Context, CollectionHookProps, GenericMiddlewareNext } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'

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

export const checkImmutabilityRead = async <T extends CollectionHookReadPayload>(
  props: CollectionHookProps<T>,
  initial: Result.Either<unknown, T>,
  context: Context,
  next: GenericMiddlewareNext<Result.Result<T>, CollectionHookProps<T>>,
) => {
  const originalPayload = throwIfError(initial)
  const { result: payload, error } = await checkImmutability(originalPayload.filters._id, props, context)
  if( error ) {
    return Result.error(error)
  }

  return next(payload, Result.result(payload), context)
}

export const checkImmutabilityWrite = async <T extends CollectionHookWritePayload>(
  props: CollectionHookProps<T>,
  initial: Result.Either<unknown, T>,
  context: Context,
  next: GenericMiddlewareNext<Result.Result<T>, CollectionHookProps<T>>,
) => {
  const originalPayload = throwIfError(initial)
  const { result: payload, error } = await checkImmutability(originalPayload.what._id, props, context)
  if( error ) {
    return Result.error(error)
  }

  return next(payload, Result.result(payload), context)
}

