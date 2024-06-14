import type { Context } from '@aeriajs/types'
import type { SecurityCheckProps, SecurityCheckReadPayload, SecurityCheckWritePayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'

export const checkImmutability = async (
  props: SecurityCheckProps<
    | SecurityCheckReadPayload
    | SecurityCheckWritePayload
  >,
  context: Context,
) => {
  if( !context.description.immutable ) {
    return Result.result(props.payload)
  }

  const docId = 'filters' in props.payload
    ? props.payload.filters._id
    : props.payload.what._id

  if( docId ) {
    if( typeof context.description.immutable === 'function' ) {
      const doc = await context.collection.model.findOne({
        _id: docId,
      })

      if( !doc ) {
        return Result.error(ACError.ResourceNotFound)
      }

      const isImmutable = await context.description.immutable(doc)
      return isImmutable
        ? Result.error(ACError.TargetImmutable)
        : Result.result(props.payload)
    }

    return Result.error(ACError.TargetImmutable)
  }

  return Result.result(props.payload)
}

