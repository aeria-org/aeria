import type { Context, RemoveFilePayload } from '@aeriajs/types'
import { checkImmutability } from '@aeriajs/security'

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

  return context.collections.file.functions!.remove(props)
}
