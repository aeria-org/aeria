import type { Context, InsertPayload } from '@aeriajs/types'
import type { SecurityCheckProps, SecurityCheckReadPayload } from './types.js'
import { Result, ACError } from '@aeriajs/types'

export const checkOwnershipRead = async (props: SecurityCheckProps<SecurityCheckReadPayload>, context: Context) => {
  const { token, description } = context
  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
    if( !token.roles.includes('root') ) {
      payload.filters.owner = token.sub
    }
  }

  return Result.result(payload)
}

export const checkOwnershipWrite = async (props: SecurityCheckProps<InsertPayload<any>>, context: Context) => {
  const { token, description } = context
  const { parentId } = props

  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
    if( !payload.what._id || description.owned === 'always' ) {
      payload.what.owner = token.sub
    } else {
      return Result.result(payload)
    }
  }

  if( (!payload.what.owner && !parentId) && context.description.owned ) {
    return Result.error(ACError.OwnershipError)
  }

  return Result.result(payload)
}

