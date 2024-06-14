import type { SecurityCheckProps, SecurityCheckReadPayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'

export const checkPagination = async (props: SecurityCheckProps<SecurityCheckReadPayload>) => {
  const { payload } = props
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return Result.result(payload)
}

