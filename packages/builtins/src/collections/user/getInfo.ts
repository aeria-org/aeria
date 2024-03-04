import type { Context } from '@aeriajs/types'
import type { description } from './description'
import { ObjectId } from '@aeriajs/api'
import { left, right } from '@aeriajs/common'
import bcrypt from 'bcrypt'

export enum ActivationErrors {
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
    return left(ActivationErrors.InvalidLink)
  }

  const user = await context.collection.model.findOne({
    _id: new ObjectId(userId),
  })

  if( !user ) {
    return left(ActivationErrors.UserNotFound)
  }
  if( user.active ) {
    return left(ActivationErrors.AlreadyActiveUser)
  }

  const equal = await bcrypt.compare(user._id.toString(), token)
  if( !equal ) {
    return left(ActivationErrors.InvalidLink)
  }

  return right({
    name: user.name,
    email: user.email,
  })
}

