import type { Context, InsertPayload } from '@aeriajs/types'
import type { SecurityCheckProps, SecurityCheckReadPayload } from './types.js'
import { ACErrors } from '@aeriajs/types'
import { left, right } from '@aeriajs/common'

export const checkOwnershipRead = async (props: SecurityCheckProps<SecurityCheckReadPayload>, context: Context) => {
  const { token, description } = context
  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
    if( !token.roles.includes('root') ) {
      payload.filters.owner = token.sub
    }
  }

  return right(payload)
}

export const checkOwnershipWrite = async (props: SecurityCheckProps<InsertPayload<any>>, context: Context) => {
  const { token, description } = context
  const { parentId } = props

  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
    if( !payload.what._id || description.owned === 'always' ) {
      payload.what.owner = token.sub
    } else {
      return right(payload)
    }
  }

  if( (!payload.what.owner && !parentId) && context.description.owned ) {
    return left(ACErrors.OwnershipError)
  }

  return right(payload)
}

