import type { Context, RemoveAllPayload } from '@aeriajs/types'
import { unsafe } from '@aeriajs/common'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export const removeAll = async <TContext extends Context>(payload: RemoveAllPayload, context: TContext) => {
  const filtersWithId = {
    ...payload.filters,
    _id: {
      $in: payload.filters,
    },
  }

  const filters = unsafe(await traverseDocument(filtersWithId, context.description, {
    autoCast: true,
  }))

  const it = context.collection.model.find(filters)

  let document: typeof context.collection.item
  while( document = await it.next() ) {
    await cascadingRemove(document, context)
  }

  return context.collection.model.deleteMany(filters)
}

