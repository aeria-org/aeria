import type { Context, CollectionProps, CollectionReadPayload, CollectionWritePayload } from '@aeriajs/types'
import type { ReadMiddlewareReturn, WriteMiddlewareReturn } from '../types.js'
import { Result, ACError } from '@aeriajs/types'

export const checkOwnershipRead = async <T extends CollectionReadPayload>(
  props: Result.Result<CollectionProps<T>>,
  context: Context,
  next: (payload: typeof props, context: Context)=> ReadMiddlewareReturn<CollectionProps<T>>,
) => {
  const { token, description } = context
  const { payload } = props.result

  if( token.authenticated && description.owned && description.owned !== 'on-write' ) {
    if( !token.roles.includes('root') ) {
      payload.filters.owner = token.sub
    }
  }

  return next(Result.result({
    ...props.result,
    payload,
  }), context)
}

export const checkOwnershipWrite = async <T extends CollectionWritePayload>(
  props: Result.Result<CollectionProps<T>>,
  context: Context,
  next: (payload: typeof props, context: Context)=> WriteMiddlewareReturn<CollectionProps<T>>,
) => {
  const { token, description } = context
  const { payload, parentId } = props.result

  if( token.authenticated && description.owned ) {
    if( !payload.what._id || description.owned === 'always' ) {
      payload.what.owner = token.sub
    } else {
      return next(props, context)
    }
  }

  if( (!payload.what.owner && !parentId) && context.description.owned ) {
    return Result.error(ACError.OwnershipError)
  }

  return next(Result.result({
    ...props.result,
    payload,
  }), context)
}

