import type { CollectionHookProps, GenericMiddlewareNext, Context, CollectionHookReadPayload } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'

export const checkPagination = async <T extends CollectionHookReadPayload>(
  props: Result.Result<CollectionHookProps<T>>,
  context: Context,
  next: GenericMiddlewareNext<typeof props, typeof props>,
) => {
  const { payload } = props.result
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return next(props, context)
}

