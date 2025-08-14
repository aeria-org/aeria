import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { decodeToken, ObjectId } from '@aeriajs/core'
import { Result, ACError, HTTPStatus, defineContract, resultSchema, endpointErrorSchema } from '@aeriajs/types'
import * as bcrypt from 'bcryptjs'

export const ActivationError = {
  UserNotFound: 'USER_NOT_FOUND',
  AlreadyActiveUser: 'ALREADY_ACTIVE_USER',
  InvalidLink: 'INVALID_LINK',
  InvalidToken: 'INVALID_TOKEN',
} as const

export const activateContract = defineContract({
  payload: {
    type: 'object',
    required: [],
    properties: {
      password: {
        type: 'string',
      },
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
        HTTPStatus.Forbidden,
        HTTPStatus.Unauthorized,
        HTTPStatus.UnprocessableContent,
      ],
      code: [
        ACError.ResourceNotFound,
        ACError.MalformedInput,
        ActivationError.AlreadyActiveUser,
        ActivationError.InvalidLink,
        ActivationError.InvalidToken,
        ActivationError.UserNotFound,
      ],
    }),
    resultSchema({
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'objectid',
        },
      },
    }),
  ],
})

export const activate: ContractToFunction<typeof activateContract, Context<typeof description>> = async (payload, context) => {
  const {
    userId,
    token,
    password,
  } = payload

  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  if( !userId || !token ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.InvalidLink,
    })
  }

  const user = await context.collection.model.findOne({
    _id: new ObjectId(userId),
  }, {
    projection: {
      password: 1,
      active: 1,
    },
  })

  if( !user ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.UserNotFound,
    })
  }
  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }
  const { error } = await decodeToken(token, context.config.secret)
  if( error ){
    return context.error(HTTPStatus.Unauthorized, {
      code: ActivationError.InvalidToken,
    })
  }

  if( !user.password ) {
    if( !password ) {
      return context.error(HTTPStatus.UnprocessableContent, {
        code: ACError.MalformedInput,
      })
    }

    await context.collection.model.updateOne({
      _id: user._id,
    }, {
      $set: {
        active: true,
        password: await bcrypt.hash(password, 10),
      },
    })
  } else {
    await context.collection.model.updateOne({
      _id: user._id,
    }, {
      $set: {
        active: true,
      },
    })

  }

  return Result.result({
    userId: user._id,
  })
}

