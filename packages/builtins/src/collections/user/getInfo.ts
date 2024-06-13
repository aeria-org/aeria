import type { Context } from '@aeriajs/types'
import type { description } from './description'
import * as bcrypt from 'bcrypt'
import { HTTPStatus } from '@aeriajs/types'
import { ObjectId } from '@aeriajs/core'
import { Result } from '@aeriajs/common'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
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
  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }

  const equal = await bcrypt.compare(user._id.toString(), token)
  if( !equal ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.InvalidLink,
    })
  }

  return Result.result({
    name: user.name,
    email: user.email,
  })
}

