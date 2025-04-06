import { Description, GetAllPayload, Result, SchemaWithId, Context, CountReturnType } from '@aeriajs/types'
import { makePagination } from '../collection/makePagination.js'
import { getAll } from './getAll.js'

export const paginatedGetAll = async <TDescription extends Description, TFunctions>(
  payload: GetAllPayload<SchemaWithId<TDescription>>,
  context: Context<TDescription, TFunctions & {
    count?: (...args: unknown[])=> Promise<CountReturnType>
  }>,
) => {
  const { error, result } = await getAll(payload, context)
  if( error ) {
    return Result.error(error)
  }

  return Result.result({
    data: result,
    pagination: await makePagination(payload, result, context),
  })
}

