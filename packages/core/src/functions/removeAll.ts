import type { WithId } from 'mongodb'
import type { Context, SchemaWithId, RemoveAllPayload } from '@aeriajs/types'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { useSecurity } from '@aeriajs/security'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export type RemoveAllOptions = {
  bypassSecurity?: boolean
}

const internalRemoveAll = async <TContext extends Context>(
  payload: RemoveAllPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  const filters = throwIfError(await traverseDocument<Record<string, unknown>>({
    _id: {
      $in: payload.filters,
    },
  }, context.description, {
    autoCast: true,
    context,
  }))

  const it = context.collection.model.find(filters)

  let doc: WithId<unknown> | null
  while( doc = await it.next() ) {
    await cascadingRemove(doc, context)
  }

  return Result.result(await context.collection.model.deleteMany(filters))
}

export const removeAll = async <TContext extends Context>(
  payload: RemoveAllPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: RemoveAllOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalRemoveAll(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
    return context.error(HTTPStatus.Forbidden, {
      code: error,
    })
  }

  return internalRemoveAll(securedPayload, context)
}

