import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { decodeToken, ObjectId } from '@aeriajs/core'
import { Result, ACError, HTTPStatus, resultSchema, functionSchemas, endpointErrorSchema, defineContract } from '@aeriajs/types'
import * as bcrypt from 'bcryptjs'

export const RedefinePasswordError = {
  UserNotFound: 'USER_NOT_FOUND',
  UserNotActive: 'USER_NOT_ACTIVE',
  InvalidLink: 'INVALID_LINK',
  InvalidToken: 'INVALID_TOKEN',
} as const

export const redefinePasswordContract = defineContract({
  payload: {
    type: 'object',
    required: [],
    properties: {
      userId: {
        type: 'string',
        format: 'objectid',
      },
      password: {
        type: 'string',
      },
      token: {
        type: 'string',
      },
    },
  },
  response: [
    functionSchemas.getError(),
    endpointErrorSchema({
      httpStatus: [
        HTTPStatus.NotFound,
        HTTPStatus.Forbidden,
        HTTPStatus.Unauthorized,
        HTTPStatus.UnprocessableContent,
      ],
      code: [
        ACError.MalformedInput,
        RedefinePasswordError.InvalidLink,
        RedefinePasswordError.InvalidToken,
        RedefinePasswordError.UserNotFound,
        RedefinePasswordError.UserNotActive,
      ],
    }),
    resultSchema({
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'objectid',
        }
      },
    }),
  ],
})

export const redefinePassword: ContractToFunction<typeof redefinePasswordContract, Context<typeof description>> = async (payload, context) => {
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
      code: RedefinePasswordError.InvalidLink,
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
      code: RedefinePasswordError.UserNotFound,
    })
  }

  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: RedefinePasswordError.UserNotActive,
    })
  }
  const decoded = await decodeToken(token, context.config.secret)
  if(!decoded){
    return context.error(HTTPStatus.Unauthorized, {
      code: RedefinePasswordError.InvalidToken,
    })
  }

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

  return Result.result({
    userId: user._id,
  })
}

