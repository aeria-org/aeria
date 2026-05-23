import type { WithId } from 'mongodb'
import type { Context, RemoveAllPayload, GetPayload } from '@aeriajs/types'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { useSecurity } from '@aeriajs/security'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export type RemoveAllOptions = {
  bypassSecurity?: boolean
}

const internalRemoveAll = async <TContext extends Context>(
  payload: Pick<GetPayload<WithId<unknown>>, 'filters'>,
  context: TContext,
) => {
  const filters = throwIfError(await traverseDocument<Record<string, unknown>>(payload.filters, context.description, {
    autoCast: true,
    context,
  }))

  const it = context.collection.model.find(filters)
  for await ( const doc of it ) {
    await cascadingRemove(doc, context)
  }

  return Result.result(await context.collection.model.deleteMany(filters))
}

export const removeAll = async <TContext extends Context>(
  _payload: RemoveAllPayload,
  context: TContext,
  options: RemoveAllOptions = {},
) => {
  const payload = {
    filters: {
      _id: {
        $in: _payload.filters,
      },
    },
  }

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

