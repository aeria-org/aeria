import type { ObjectId } from '@aeriajs/core'
import { getConfig } from '@aeriajs/entrypoint'

export const getActivationLink = async (userId: ObjectId) => {
  const config = await getConfig()
  const bcrypt = await import('bcrypt')

  const activationToken = await bcrypt.hash(userId.toString(), 10)
  const link = `${config.publicUrl}/user/activate?u=${userId.toString()}&t=${activationToken}`

  return link
}

