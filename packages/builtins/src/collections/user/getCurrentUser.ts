import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, defineContract, resultSchema } from '@aeriajs/types'
import { get } from '@aeriajs/core'
import { defaultSuccessfulAuthentication } from '../../authentication.js'

export const ActivationError = {
  UserNotFound: 'USER_NOT_FOUND',
  AlreadyActiveUser: 'ALREADY_ACTIVE_USER',
  InvalidLink: 'INVALID_LINK',
} as const

export const getCurrentUserContract = defineContract({
  response: [
    resultSchema({
      $ref: 'user',
    }),
    resultSchema({
      type: 'object',
      properties: {
        _id: {
          const: null,
        },
        name: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        roles: {
          type: 'array',
          items: {
            type: 'string',
          }
        },
        active: {
          type: 'boolean'
        }
      },
    })
  ],
})

export const getCurrentUser: ContractToFunction<typeof getCurrentUserContract, Context<typeof description>> = async (_payload, context) => {
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

