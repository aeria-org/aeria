import type { Context } from '@aeriajs/types'
import { ObjectId, signToken } from '@aeriajs/core'
import { Result, HTTPStatus } from '@aeriajs/types'
import { ActivationError } from './activate.js'

export const getActivationToken = async (strId: string, context: Context) => {
  if( context.calledFunction === 'getActivationToken' ) {
    throw new Error('cannot be called externally')
  }
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  } 
  
  const token = await signToken({data:strId}, context.config.secret, {
    expiresIn: context.config.security.tokenExpiration
  })
  
  return token
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

  const url = `${context.config.publicUrl}/user/activation?step=password&u=${payload.userId.toString()}&t=${activationToken}`

  return Result.result({
    url,
  })
}
