import type { Context, RemoveFilePayload } from '@aeriajs/types'
import { checkImmutabilityRead } from '@aeriajs/security'
import { Result } from '@aeriajs/types'

export const removeFile = async <TContext extends Context>(
  payload: RemoveFilePayload,
  context: TContext,
) => {
  const {
    propertyName,
    parentId,
    ...props
  } = payload

  await checkImmutabilityRead({
    propertyName,
    parentId,
    childId: props.filters._id,
    payload: props,
  }, context)

  const doc = await context.collections.file.functions!.remove(props)
  return Result.result(doc)
}

