import type { Context } from '@aeriajs/types'
import { makePagination } from '@aeriajs/api'

export const appendPagination = async (result: any, context: Context) => {
  if( context.calledFunction === 'getAll' ) {
    return {
      data: result,
      pagination: await makePagination(
        context.request.payload,
        result,
        context,
      ),
    }
  }

  return result
}

