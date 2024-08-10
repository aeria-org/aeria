import type { Context, RemoveFilePayload } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'

export type RemoveFileOptions = {
  bypassSecurity?: boolean
}

const internalRemoveFile = async <TContext extends Context>(
  payload: RemoveFilePayload,
  context: TContext,
) => {
  const {
    propertyName,
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
  const { error, result: securedPayload } = await security.beforeRead(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
  }
  return internalRemoveFile(securedPayload, context)
}

