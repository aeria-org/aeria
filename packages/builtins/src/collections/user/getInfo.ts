import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus } from '@aeriajs/types'
import { decodeToken, ObjectId } from '@aeriajs/core'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
  InvalidToken = 'INVALID_TOKEN'
}

export const getInfo = async (
  payload: {
    userId: string
    token: string
  },
  context: Context<typeof description>,
) => {
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
      code: ActivationError.InvalidToken
    })
  }

  return Result.result({
    name: user.name,
    email: user.email,
    active: user.active
  })
}

