import type { Context } from '@aeriajs/types'
import type { SecurityCheckProps, SecurityCheckReadPayload, SecurityCheckWritePayload } from './types.js'
import { ACError } from '@aeriajs/types'
import { left, right } from '@aeriajs/common'

export const checkImmutability = async (
  props: SecurityCheckProps<
    | SecurityCheckReadPayload
    | SecurityCheckWritePayload
  >,
  context: Context,
) => {
  if( !context.description.immutable ) {
    return right(props.payload)
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
        return left(ACError.ResourceNotFound)
      }

      const isImmutable = await context.description.immutable(doc)
      return isImmutable
        ? left(ACError.TargetImmutable)
        : right(props.payload)
    }

    return left(ACError.TargetImmutable)
  }

  return right(props.payload)
}

