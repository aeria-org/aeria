import type { SecurityCheckProps, SecurityCheckReadPayload } from './types.js'
import { ACErrors } from '@aeriajs/types'
import { left, right } from '@aeriajs/common'

export const checkPagination = async (props: SecurityCheckProps<SecurityCheckReadPayload>) => {
  const { payload } = props
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return left(ACErrors.InvalidLimit)
    }
  }

  return right(payload)
}

