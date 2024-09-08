import type { CollectionHookProps, GenericMiddlewareNext, Context } from '@aeriajs/types'
import type { CollectionHookReadPayload } from '../types.js'
import { Result, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'

export const checkPagination = async <T extends CollectionHookReadPayload>(
  props: CollectionHookProps<T>,
  initial: Result.Either<unknown, T>,
  context: Context,
  next: GenericMiddlewareNext<CollectionHookProps<T>, Result.Result<T>>,
) => {
  const payload = throwIfError(initial)
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return next(props, Result.result(payload), context)
}

