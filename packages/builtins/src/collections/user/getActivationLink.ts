import type { Context } from '@aeriajs/types'
import type { ObjectId } from '@aeriajs/core'
import { Result, HTTPStatus } from '@aeriajs/types'
import * as bcrypt from 'bcrypt'
import { ActivationError } from './activate.js'

export const getActivationToken = async (strId: string, context: Context) => {
  if( context.calledFunction === 'getActivationToken' ) {
    throw new Error('cannot be called externally')
  }
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  return `${context.config.secret}:${strId}`
}

export const getActivationLink = async (payload: { userId: ObjectId | string }, context: Context) => {
  const { error, result: user } = await context.collections.user.functions.get({
    filters: {
      _id: payload.userId,
    },
    project: ['active'],
  })

  if( error ) {
    return Result.error(error)
  }

  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }

  const activationToken = await getActivationToken(payload.userId.toString(), context)
  const encryptedActivationToken = await bcrypt.hash(activationToken, 10)

  const url = `${context.config.publicUrl}/user/activate?u=${payload.userId.toString()}&t=${encryptedActivationToken}`

  return Result.result({
    url,
  })
}

