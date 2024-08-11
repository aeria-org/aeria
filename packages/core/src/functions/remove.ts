import type { Context, SchemaWithId, RemovePayload } from '@aeriajs/types'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { useSecurity } from '@aeriajs/security'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export type RemoveOptions = {
  bypassSecurity?: boolean
}

const internalRemove = async <TContext extends Context>(
  payload: RemovePayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  if( !payload.filters._id ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const filters = throwIfError(await traverseDocument(payload.filters, context.description, {
    autoCast: true,
  }))

  const target = await context.collection.model.findOne(filters)
  if( !target ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  await cascadingRemove(target, context)
  return Result.result(await context.collection.model.findOneAndDelete(filters))
}

export const remove = async <TContext extends Context>(
  payload: RemovePayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: RemoveOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalRemove(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
  }
  return internalRemove(securedPayload, context)
}
