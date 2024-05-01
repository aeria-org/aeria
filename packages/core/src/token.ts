import type { SignOptions } from 'jsonwebtoken'
import { getConfig } from '@aeriajs/entrypoint'
import * as jwt from 'jsonwebtoken'

export const EXPIRES_IN = 36000

const getApplicationSecret = async () => {
  const config = await getConfig()
  if( !config.secret ) {
    throw new Error('application secret is not set')
  }

  return config.secret
}

export const signToken = async (_payload: Record<string, any>, secret?: string | null, options?: SignOptions) => {
  const fallbackSecret = await getApplicationSecret()
  const payload = Object.assign({}, _payload)

  delete payload.iat
  delete payload.exp

  const signed = jwt.sign(payload, secret || fallbackSecret, options || {
    expiresIn: EXPIRES_IN,
  })

  return signed
}

export const verifyToken = async <TToken>(token: string, secret?: string) => {
  const fallbackSecret = await getApplicationSecret()
  return jwt.verify(token, secret || fallbackSecret) as TToken
}

export const decodeToken = <TToken>(token: string, secret?: string) => {
  return verifyToken<TToken>(token, secret)
}
