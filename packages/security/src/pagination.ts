import type { SecurityCheckProps, SecurityCheckReadPayload } from './types.js'
import { ACError } from '@aeriajs/types'
import { Result } from '@aeriajs/common'

export const checkPagination = async (props: SecurityCheckProps<SecurityCheckReadPayload>) => {
  const { payload } = props
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return Result.error(ACError.InvalidLimit)
    }
  }

  return Result.result(payload)
}

