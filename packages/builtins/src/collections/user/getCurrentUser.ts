import type { Context, SchemaWithId } from '@aeriajs/types'
import type { description } from './description.js'

export enum ActivationErrors {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

export const getCurrentUser = async (
  _payload: undefined,
  context: Context<typeof description>,
) => {
  if( !context.token.authenticated ) {
    throw new Error()
  }

  const user = await context.collections.user.functions.get({
    filters: {
      _id: context.token.sub,
    },
  })

  if( !user ) {
    throw new Error()
  }

  const nonNullableUser: SchemaWithId<typeof description> = user
  return nonNullableUser
}

