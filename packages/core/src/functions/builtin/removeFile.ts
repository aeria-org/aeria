import type { Context, RemoveFilePayload } from '@aeriajs/types'
import { checkImmutability } from '@aeriajs/security'
import { Result } from '@aeriajs/common'

export const removeFile = async <TContext extends Context>(
  payload: RemoveFilePayload,
  context: TContext,
) => {
  const {
    propertyName,
    parentId,
    ...props
  } = payload

  await checkImmutability({
    propertyName,
    parentId,
    childId: props.filters._id,
    payload: props,
  }, context)

  const doc = await context.collections.file.functions!.remove(props)
  return Result.result(doc)
}

