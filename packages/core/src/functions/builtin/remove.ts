import type { Context, SchemaWithId, RemovePayload } from '@aeriajs/types'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { throwIfLeft } from '@aeriajs/common'
import { traverseDocument, cascadingRemove } from '../../collection/index.js'

export const remove = async <TContext extends Context>(
  payload: RemovePayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  if( !payload.filters._id ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const filters = throwIfLeft(await traverseDocument(payload.filters, context.description, {
    autoCast: true,
  }))

  const target = await context.collection.model.findOne(filters)
  if( !target ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  await cascadingRemove(target, context)
  return context.collection.model.findOneAndDelete(filters)
}

