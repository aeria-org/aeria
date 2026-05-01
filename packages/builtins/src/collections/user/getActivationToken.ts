import type { Context } from '@aeriajs/types'
import type { ObjectId } from '@aeriajs/core'
import { throwIfError } from '@aeriajs/common'
import { signToken } from '@aeriajs/core'

export const getActivationToken = async (user: { _id: ObjectId, active?: boolean, password?: string }, context: Context) => {
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  const token = throwIfError(await signToken({
    data: user._id.toString(),
  }, `${context.config.secret}:${user.password||''}`, {
    expiresIn: context.config.security.linkTokenExpiration,
  }))

  return token
}


