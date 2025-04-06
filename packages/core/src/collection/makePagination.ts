import type { Context, SchemaWithId, Description, Pagination, GetAllPayload, CountReturnType } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { count } from '../functions/count.js'

export const makePagination = async <TDescription extends Description>(
  payload: GetAllPayload<SchemaWithId<TDescription>>,
  documents: unknown[],
  context: Context<Description, {
    count?: (...args: unknown[])=> Promise<CountReturnType>
  }>,
): Promise<Pagination> => {
  const {
    offset = 0,
    limit = context.config.defaultPaginationLimit!,
  } = payload

  const recordsTotal = typeof context.collection.functions.count === 'function'
    ? throwIfError(await context.collection.functions.count({
      filters: payload.filters,
    }))
    : throwIfError(await count({
      filters: payload.filters,
    }, context))

  return {
    recordsCount: documents.length,
    recordsTotal,
    offset,
    limit,
  }
}

