import type { Context, SchemaWithId, RemovePayload } from '@aeriajs/types'
import { left, unsafe } from '@aeriajs/common'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export const remove = async <TContext extends Context>(
  payload: RemovePayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  if( !payload.filters._id ) {
    return left({
      message: 'you must pass an _id as filter',
    })
  }

  const filters = unsafe(await traverseDocument(payload.filters, context.description, {
    autoCast: true,
  }))

  const target = await context.collection.model.findOne(filters)
  if( !target ) {
    return left({
      message: 'target not found',
    })
  }

  await cascadingRemove(target, context)
  return context.collection.model.findOneAndDelete(filters)
}
