import type { Context, RemoveAllPayload, CollectionItem } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { useSecurity } from '@aeriajs/security'
import { traverseDocument, cascadingRemove } from '../../collection/index.js'

export type RemoveAllOptions = {
  bypassSecurity?: boolean
}

const internalRemoveAll = async <TContext extends Context>(payload: RemoveAllPayload, context: TContext) => {
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

  let doc: CollectionItem<any> | null
  while( doc = await it.next() ) {
    await cascadingRemove(doc, context)
  }

  return Result.result(await context.collection.model.deleteMany(filters))
}

export const removeAll = async <TContext extends Context>(
  payload: RemoveAllPayload,
  context: TContext,
  options: RemoveAllOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalRemoveAll(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.beforeRead(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
  }
  return internalRemoveAll(securedPayload, context)
}

