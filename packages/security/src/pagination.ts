import type { CollectionHookProps } from '@aeriajs/types'
import type { CollectionHookReadPayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'

export const checkPagination = async <T extends CollectionHookReadPayload>(props: CollectionHookProps<T>) => {
  const { payload } = props
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return Result.result(payload)
}

