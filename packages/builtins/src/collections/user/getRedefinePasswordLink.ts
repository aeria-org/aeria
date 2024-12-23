import type { Context } from '@aeriajs/types'
import { type ObjectId } from '@aeriajs/core'
import { Result, HTTPStatus } from '@aeriajs/types'
import { ActivationError } from './redefinePassword.js'
import { getActivationToken } from './getActivationLink.js'

export const getRedefinePasswordLink = async (payload: { userId: ObjectId | string, redirect?:string }, context: Context) => {
  if(!context.config.webPublicUrl){
    throw new Error('config.webPublicUrl is not set')
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
  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.UserNotActive,
    })
  }

  const redefineToken = await getActivationToken(payload.userId.toString(), context)

  const url = new URL(`${context.config.webPublicUrl}/user/activation`)
  url.searchParams.set("step", "password"),
  url.searchParams.set("u", payload.userId.toString())
  url.searchParams.set("t", redefineToken)
  if(payload.redirect){
    url.searchParams.set('next', payload.redirect)
  }
  return Result.result({
    url,
  })
}
