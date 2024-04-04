import type { ObjectId } from '@aeriajs/api'
import { getConfig } from '@aeriajs/entrypoint'
import bcrypt from 'bcrypt'

export const getActivationLink = async (userId: ObjectId) => {
  const config = await getConfig()

  const activationToken = await bcrypt.hash(userId.toString(), 10)
  const link = `${config.publicUrl}/user/activate?u=${userId.toString()}&t=${activationToken}`

  return link
}

