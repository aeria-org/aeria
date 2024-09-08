import type { CollectionHookProps, GenericMiddlewareNext, Context, CollectionHookReadPayload } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'

export const checkPagination = async <T extends CollectionHookReadPayload>(
  props: Result.Result<CollectionHookProps<T>>,
  context: Context,
  next: GenericMiddlewareNext<typeof props, typeof props>,
) => {
  const { payload } = props.result
  if( payload.limit && context.config.security.paginationLimit ) {
    if( payload.limit <= 0 || payload.limit > context.config.security.paginationLimit ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return next(props, context)
}

