import type { Context } from '@aeriajs/types'
import type { SecurityCheckProps, SecurityCheckReadPayload, SecurityCheckWritePayload } from './types.js'

import { ACErrors, ObjectId } from '@aeriajs/types'
import { left, right, isLeft } from '@aeriajs/common'

const internalCheckImmutability = async (
  props: SecurityCheckProps<SecurityCheckReadPayload | SecurityCheckWritePayload>,
  context: Context,
) => {
  const {
    propertyName = '',
    parentId,
    childId,
    payload,
  } = props

  const { description } = context
  const source = 'what' in payload
    ? payload.what
    : payload.filters

  const property = description.properties[propertyName]
  if( !property ) {
    return right(props.payload)
  }

  const immutable = parentId && (
    description.immutable === true
    || (Array.isArray(description.immutable) && description.immutable.includes(propertyName) )
  )

  const currentDocument: Record<string, any> | null = await context.collection.model.findOne({
    _id: new ObjectId(parentId),
  })
  if( !currentDocument ) {
    return left(ACErrors.ImmutabilityParentNotFound)
  }

  if( childId ) {
    if(
      (Array.isArray(currentDocument[propertyName]) && !currentDocument[propertyName].some((child) => child.toString() === childId))
      || (!Array.isArray(currentDocument[propertyName]) && currentDocument[propertyName] && currentDocument[propertyName] !== childId.toString())
    ) {
      return left(ACErrors.ImmutabilityIncorrectChild)
    }
  }

  const fulfilled = currentDocument[propertyName]
    && (typeof currentDocument[propertyName] === 'object' && !Object.keys(currentDocument[propertyName]).length)

  if(
    immutable
    && fulfilled
    && ( property.inline || (currentDocument[propertyName]).toString() !== source[propertyName] )
  ) {
    return left(ACErrors.ImmutabilityTargetImmutable)
  }

  return right(props.payload)
}

export const checkImmutability = async (
  props: SecurityCheckProps<SecurityCheckReadPayload | SecurityCheckWritePayload>,
  context: Context,
) => {
  if( !props.parentId ) {
    return right(props.payload)
  }

  for( const propertyName of Object.keys(props.payload) ) {
    const result = await internalCheckImmutability({
      ...props,
      propertyName,
    }, context)

    if( isLeft(result) ) {
      return result
    }
  }

  return internalCheckImmutability(props, context)
}

