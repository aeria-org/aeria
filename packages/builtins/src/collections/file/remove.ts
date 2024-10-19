import type { Context, SchemaWithId, RemovePayload } from '@aeriajs/types'
import type { description } from './description.js'
import { Result } from '@aeriajs/types'
import { remove as originalRemove, get, type ObjectId } from '@aeriajs/core'
import * as fs from 'fs/promises'

export const remove = async (payload: RemovePayload<SchemaWithId<typeof description>>, context: Context<typeof description>) => {
  const { error, result: file } = await get({
    filters: {
      _id: payload.filters._id as ObjectId,
    },
    project: ['absolute_path'],
  }, context)

  if( error ) {
    return Result.error(error)
  }

  try {
    await fs.unlink(file.absolute_path)
  } catch( err ) {
    console.trace(err)
  }

  return originalRemove(payload, context)
}

