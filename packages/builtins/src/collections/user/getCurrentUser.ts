import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { Result } from '@aeriajs/types'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

export const getCurrentUser = async (_payload: undefined, context: Context<typeof description>) => {
  if( !context.token.authenticated ) {
    throw new Error()
  }

  const { error, result: user } = await context.collections.user.functions.get({
    filters: {
      _id: context.token.sub,
    },
  })

  if( error ) {
    throw new Error()
  }

  return Result.result(user)
}

