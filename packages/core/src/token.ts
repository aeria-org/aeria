import type { SignOptions } from 'jsonwebtoken'
import { getConfig } from '@aeriajs/entrypoint'
import jwt from 'jsonwebtoken'

export const EXPIRES_IN = 36000

const getApplicationSecret = async () => {
  const config = await getConfig()
  if( !config.secret ) {
    throw new Error('application secret is not set')
  }

  return config.secret
}

export const signToken = async ({ iat, exp, ...payload }: Record<string, unknown>, secret?: string | null, options?: SignOptions) => {
  const signed = jwt.sign(payload, secret || await getApplicationSecret(), options || {
    expiresIn: EXPIRES_IN,
  })

  return signed
}

export const decodeToken = async <TToken>(token: string, secret?: string) => {
  return jwt.verify(token, secret || await getApplicationSecret()) as TToken
}

