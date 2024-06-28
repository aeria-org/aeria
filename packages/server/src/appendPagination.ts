import { Result, type Context } from '@aeriajs/types'
import { makePagination } from '@aeriajs/core'

export const appendPagination = async (value: any, context: Context) => {
  if( context.calledFunction === 'getAll' && value ) {
    const { error, result } = value
    if( error ) {
      return Result.error(error)
    }

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

