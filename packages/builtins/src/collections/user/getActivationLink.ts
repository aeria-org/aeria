import type { Context } from '@aeriajs/types'
import type { ObjectId } from '@aeriajs/core'
import { Result } from '@aeriajs/types'
import * as bcrypt from 'bcrypt'

export const getActivationToken = async (strId: string, context: Context) => {
  if( context.calledFunction === 'getActivationToken' ) {
    throw new Error('cannot be called externally')
  }
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  return `${context.config.secret}:${strId}`
}

export const getActivationLink = async (userId: ObjectId, context: Context) => {
  const activationToken = await getActivationToken(userId.toString(), context)
  const encryptedActivationToken = await bcrypt.hash(activationToken, 10)

  const link = `${context.config.publicUrl}/user/activate?u=${userId.toString()}&t=${encryptedActivationToken}`

  return Result.result(link)
}

