import type { Context, ContractToFunction } from '@aeriajs/types'
import { type description } from './description.js'
import { Result, HTTPStatus, defineContract, resultSchema, endpointErrorSchema } from '@aeriajs/types'
import { decodeToken, ObjectId } from '@aeriajs/core'

export const ActivationError = {
  UserNotFound: 'USER_NOT_FOUND',
  AlreadyActiveUser: 'ALREADY_ACTIVE_USER',
  InvalidLink: 'INVALID_LINK',
  InvalidToken: 'INVALID_TOKEN',
} as const

export const getInfoContract = defineContract({
  payload: {
    type: 'object',
    required: [],
    properties: {
      userId: {
        type: 'string',
      },
      token: {
        type: 'string',
      },
    },
  },
  response: [
    endpointErrorSchema({
      httpStatus: [
        HTTPStatus.NotFound,
        HTTPStatus.Unauthorized,
        HTTPStatus.UnprocessableContent,
      ],
      code: [
        ActivationError.InvalidLink,
        ActivationError.InvalidToken,
        ActivationError.UserNotFound,
      ],
    }),
    resultSchema({
      type: 'object',
      required: [
        'name',
        'email',
      ],
      properties: {
        name: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        active: {
          type: 'boolean',
        },
      },
    }),
  ],
})

export const getInfo: ContractToFunction<typeof getInfoContract, Context<typeof description>> = async (payload, context) => {
  const {
    userId,
    token,
  } = payload

  if( !userId || !token ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.InvalidLink,
    })
  }

  const user = await context.collection.model.findOne({
    _id: new ObjectId(userId),
  })

  if( !user ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.UserNotFound,
    })
  }
  const decoded = await decodeToken(token, context.config.secret).catch(console.trace)
  if(!decoded){
    return context.error(HTTPStatus.Unauthorized, {
      code: ActivationError.InvalidToken,
    })
  }

  return Result.result({
    name: user.name,
    email: user.email,
    active: user.active,
  })
}

