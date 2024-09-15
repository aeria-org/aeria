import type { WithId } from 'mongodb'
import type { Context, Description, Pagination, GetAllPayload, CountReturnType } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'

export const makePagination = async (
  payload: GetAllPayload<WithId<unknown>>,
  documents: unknown[],
  context: Context<Description, {
    count?: (...args: unknown[])=> Promise<CountReturnType>
  }>,
): Promise<Pagination> => {
  const {
    offset = 0 ,
    limit = context.config.defaultPaginationLimit!,
  } = payload

  const recordsTotal = typeof context.collection.functions.count === 'function'
    ? throwIfError(await context.collection.functions.count({
      filters: payload.filters,
    }))
    : await context.collection.model.countDocuments(payload.filters as Record<string, unknown>)

  return {
    recordsCount: documents.length,
    recordsTotal,
    offset,
    limit,
  }
}

