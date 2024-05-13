import type { Context, SchemaWithId } from '@aeriajs/types'
import type { description } from './description'
import { defineExposedFunction } from '@aeriajs/core'
import { left, right } from '@aeriajs/common'

export enum ActivationErrors {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

export const getCurrentUser = defineExposedFunction(async (
  _payload: undefined,
  context: Context<typeof description>,
) => {
  if( !context.token.authenticated ) {
    return left({})
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
  return right(nonNullableUser)
})

