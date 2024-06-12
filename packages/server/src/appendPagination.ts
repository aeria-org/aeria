import type { Context } from '@aeriajs/types'
import { makePagination } from '@aeriajs/core'

export const appendPagination = async (value: any, context: Context) => {
  if( context.calledFunction === 'getAll' && value ) {
    const { result } = value
    if( Array.isArray(result) ) {
      return {
        data: result,
        pagination: await makePagination(
          context.request.payload,
          result,
          context,
        ),
      }
    }
  }

  return value
}

