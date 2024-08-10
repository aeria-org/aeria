import type { GenericMiddlewareNext, Context, CollectionHookProps } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from '../types.js'
import { Result, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'

export const checkOwnershipRead = async <T extends CollectionHookReadPayload>(
  props: CollectionHookProps<T>,
  initial: Result.Either<unknown, T>,
  context: Context,
  next: GenericMiddlewareNext<Result.Result<T>, CollectionHookProps<T>>,
) => {
  const { token, description } = context
  const payload = throwIfError(initial)

  if( token.authenticated && description.owned ) {
    if( !token.roles.includes('root') ) {
      payload.filters.owner = token.sub
    }
  }

  return next(props, Result.result(payload), context)
}

export const checkOwnershipWrite = async <T extends CollectionHookWritePayload>(
  props: CollectionHookProps<T>,
  initial: Result.Either<unknown, T>,
  context: Context,
  next: GenericMiddlewareNext<Result.Result<T>, CollectionHookProps<T>>,
) => {
  const { token, description } = context
  const { parentId } = props

  const payload = throwIfError(initial)

  if( token.authenticated && description.owned ) {
    if( !payload.what._id || description.owned === 'always' ) {
      payload.what.owner = token.sub
    } else {
      return next(props, Result.result(payload), context)
    }
  }

  if( (!payload.what.owner && !parentId) && context.description.owned ) {
    return Result.error(ACError.OwnershipError)
  }

  return next(props, Result.result(payload), context)
}

