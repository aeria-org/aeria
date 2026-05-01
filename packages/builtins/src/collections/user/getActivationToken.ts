import type { Context } from '@aeriajs/types'
import type { ObjectId } from '@aeriajs/core'
import { throwIfError } from '@aeriajs/common'
import { signToken } from '@aeriajs/core'

export const getActivationToken = async (options: { _id: ObjectId, timestamp: Date }, context: Context) => {
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  const timestamp = options.timestamp
    ? options.timestamp.getTime()
    : ''

  const token = throwIfError(await signToken({
    data: options._id.toString(),
  }, `${context.config.secret}:${timestamp}`, {
    expiresIn: context.config.security.linkTokenExpiration,
  }))

  return token
}


