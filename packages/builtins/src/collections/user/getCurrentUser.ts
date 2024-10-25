import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { Result } from '@aeriajs/types'
import { get } from '@aeriajs/core'
import { defaultSuccessfulAuthentication } from '../../authentication.js'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

export const getCurrentUser = async (_payload: undefined, context: Context<typeof description>) => {
  if( !context.token.authenticated ) {
    throw new Error()
  }

  if( !context.token.sub ) {
    const { user } = await defaultSuccessfulAuthentication()
    return Result.result(user)
  }

  const { error, result: user } = await get({
    filters: {
      _id: context.token.sub,
    },
  }, context)

  if( error ) {
    throw new Error()
  }

  return Result.result(user)
}

