import type { ObjectId } from '@aeriajs/core'
import { getConfig } from '@aeriajs/entrypoint'
import { Result } from '@aeriajs/types'
import * as bcrypt from 'bcrypt'

export const getActivationLink = async (userId: ObjectId) => {
  const config = await getConfig()

  const activationToken = await bcrypt.hash(userId.toString(), 10)
  const link = `${config.publicUrl}/user/activate?u=${userId.toString()}&t=${activationToken}`

  return Result.result(link)
}

