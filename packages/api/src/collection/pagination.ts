import type { Context, Pagination, GetAllPayload } from '@aeriajs/types'

export const makePagination = async (
  payload: GetAllPayload<any>,
  documents: any[],
  context: Context,
): Promise<Pagination> => {
  const limit = payload.limit
    ? payload.limit
    : context.config.paginationLimit!

  const offset = payload.offset || 0

  const recordsTotal = 'count' in context.collection.functions
    ? await context.collection.functions.count(payload)
    : await context.collection.model.countDocuments({
      filters: payload.filters,
    })

  return {
    recordsCount: documents.length,
    recordsTotal,
    offset,
    limit,
  }
}
