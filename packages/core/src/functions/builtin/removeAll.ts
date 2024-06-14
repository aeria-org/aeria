import type { Context, RemoveAllPayload, CollectionItem } from '@aeriajs/types'
import { Result } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { traverseDocument, cascadingRemove } from '../../collection/index.js'

export const removeAll = async <TContext extends Context>(payload: RemoveAllPayload, context: TContext) => {
  const filtersWithId = {
    ...payload.filters,
    _id: {
      $in: payload.filters,
    },
  }

  const filters = throwIfError(await traverseDocument(filtersWithId, context.description, {
    autoCast: true,
  }))

  const it = context.collection.model.find(filters)

  let doc: CollectionItem<any>
  while( doc = await it.next() ) {
    await cascadingRemove(doc, context)
  }

  return Result.result(await context.collection.model.deleteMany(filters))
}

