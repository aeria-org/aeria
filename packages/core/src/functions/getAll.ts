import type { Context, SchemaWithId, GetAllReturnType, Description, GetAllPayload, CountReturnType } from '@aeriajs/types'
import { Result } from '@aeriajs/types'
import { makePagination } from '../collection/makePagination.js'
import { unpaginatedGetAll, type GetAllOptions } from './unpaginatedGetAll.js'

export const getAll = async <TDescription extends Description, TFunctions>(
  payload: GetAllPayload<SchemaWithId<TDescription>>,
  context: Context<TDescription, undefined | TFunctions & {
    count?: (...args: unknown[])=> Promise<CountReturnType>
  }>,
  options?: GetAllOptions,
): Promise<GetAllReturnType<SchemaWithId<TDescription>>> => {
  const { error, result } = await unpaginatedGetAll(payload, context, options)
  if( error ) {
    return Result.error(error)
  }

  return Result.result({
    data: result,
    pagination: await makePagination(payload, result, context),
  })
}

