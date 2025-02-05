import type { Context, SchemaWithId, PackReferences, RemoveAllPayload } from '@aeriajs/types'
import type { description } from './description.js'
import { ObjectId, removeAll as originalRemoveAll } from '@aeriajs/core'
import * as fs from 'node:fs/promises'

export const removeAll = async (payload: RemoveAllPayload, context: Context<typeof description>) => {
  const files = context.collection.model.find({
    _id: {
      $in: payload.filters.map((oid) => new ObjectId(oid)),
    },
  }, {
    projection: {
      absolute_path: 1,
    },
  })

  let file: PackReferences<SchemaWithId<typeof description>> | null
  while( file = await files.next() ) {
    try {
      await fs.unlink(file.absolute_path)
    } catch( err ) {
      console.trace(err)
    }
  }

  return originalRemoveAll(payload, context)
}

