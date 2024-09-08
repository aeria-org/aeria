import { Result, type Context } from '@aeriajs/types'
import { isResult } from '@aeriajs/common'
import { makePagination } from '@aeriajs/core'

export const appendPagination = async (value: unknown, context: Context) => {
  if( context.calledFunction === 'getAll' && value ) {
    if( !isResult(value) ) {
      return value
    }

    const { result } = value

    if( Array.isArray(result) ) {
      return Result.result({
        data: result,
        pagination: await makePagination(
          context.request.payload,
          result,
          context,
        ),
      })
    }
  }

  return value
}

