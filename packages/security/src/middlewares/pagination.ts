import type { CollectionProps, Context, CollectionReadPayload } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'
import { ReadMiddlewareReturn } from '../types.js'

export const checkPagination = async <T extends CollectionReadPayload>(
  props: Result.Result<CollectionProps<T>>,
  context: Context,
  next: (payload: typeof props, context: Context) => ReadMiddlewareReturn<CollectionProps<T>>,
) => {
  const { payload } = props.result

  switch( typeof payload.limit ) {
    case 'undefined': break
    case 'number': {
      if( payload.limit <= 0 ) {
        return Result.error(ACError.InvalidLimit)
      }
      if( context.config.security.paginationLimit && payload.limit > context.config.security.paginationLimit ) {
        return Result.error(ACError.InvalidLimit)
      }
      break
    }
    default: {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return next(props, context)
}

