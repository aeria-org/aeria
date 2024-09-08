import type { GenericMiddlewareNext, Context, CollectionHookProps, CollectionHookReadPayload, CollectionHookWritePayload } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'

export const checkOwnershipRead = async <T extends CollectionHookReadPayload>(
  props: Result.Result<CollectionHookProps<T>>,
  context: Context,
  next: GenericMiddlewareNext<typeof props, typeof props>,
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

export const checkOwnershipWrite = async <T extends CollectionHookWritePayload>(
  props: Result.Result<CollectionHookProps<T>>,
  context: Context,
  next: GenericMiddlewareNext<typeof props, typeof props>,
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

