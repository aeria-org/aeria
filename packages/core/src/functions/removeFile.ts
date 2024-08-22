import type { Context, RemoveFilePayload } from '@aeriajs/types'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'

export type RemoveFileOptions = {
  bypassSecurity?: boolean
}

const internalRemoveFile = async <TContext extends Context>(
  payload: RemoveFilePayload,
  context: TContext,
) => {
  const {
    propName,
    parentId,
    ...props
  } = payload

  const doc = await context.collections.file.functions!.remove(props)
  return Result.result(doc)
}

export const removeFile = async <TContext extends Context>(
  payload: RemoveFilePayload,
  context: TContext,
  options: RemoveFileOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalRemoveFile(payload, context)
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

  return internalRemoveFile(securedPayload, context)
}

