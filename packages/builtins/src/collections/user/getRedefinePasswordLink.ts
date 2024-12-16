import type { Context } from '@aeriajs/types'
import { ObjectId} from '@aeriajs/core'
import { Result, HTTPStatus } from '@aeriajs/types'
import { ActivationError } from './redefinePassword.js'
import { getActivationToken } from './getActivationLink.js';

export const getRedefinePasswordLink = async (payload: { userId: ObjectId | string }, context: Context) => {
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
  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.UserNotActive,
    })
  }

  const redefineToken = await getActivationToken(payload.userId.toString(), context)

  const url = `${context.config.webPublicUrl}/user/redefine-password?step=password&u=${payload.userId.toString()}&t=${redefineToken}`

  return Result.result({
    url,
  })
}