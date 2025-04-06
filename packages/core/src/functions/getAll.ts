import { type Description, type GetAllPayload, Result, type SchemaWithId, type Context, type CountReturnType, type GetAllReturnType } from '@aeriajs/types'
import { makePagination } from '../collection/makePagination.js'
import { unpaginatedGetAll } from './unpaginatedGetAll.js'

export const getAll = async <TDescription extends Description, TFunctions>(
  payload: GetAllPayload<SchemaWithId<TDescription>>,
  context: Context<TDescription, undefined | TFunctions & {
    count?: (...args: unknown[])=> Promise<CountReturnType>
  }>,
): Promise<GetAllReturnType<SchemaWithId<TDescription>>> => {
  const { error, result } = await unpaginatedGetAll(payload, context)
  if( error ) {
    return Result.error(error)
  }

  return Result.result({
    data: result,
    pagination: await makePagination(payload, result, context),
  })
}

