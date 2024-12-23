import type { Context } from '@aeriajs/types'
import { type ObjectId, signToken } from '@aeriajs/core'
import { Result, HTTPStatus } from '@aeriajs/types'
import { ActivationError } from './activate.js'

export const getActivationToken = async (strId: string, context: Context) => {
  if( context.calledFunction === 'getActivationToken' ) {
    throw new Error('cannot be called externally')
  }
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  const token = await signToken({
    data: strId,
  }, context.config.secret, {
    expiresIn: context.config.security.linkTokenExpiration,
  })

  return token
}

export const getActivationLink = async (payload: { userId: ObjectId | string, redirect?:string}, context: Context) => {
  if(!context.config.webPublicUrl){
    return context.error(HTTPStatus.BadRequest, {
      code: ActivationError.InvalidLink,
    })
  }
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

  //const url = `${context.config.webPublicUrl}/user/activation?step=password&u=${payload.userId.toString()}&t=${activationToken}`
  const url = new URL(`${context.config.webPublicUrl}/user/activation`)
  url.searchParams.set("step", "password"),
  url.searchParams.set("u", payload.userId.toString())
  url.searchParams.set("t", activationToken)
  if(payload.redirect){
    url.searchParams.set('next', payload.redirect)
  }
  
  return Result.result({
    url,
  })
}
