import type { SignOptions } from 'jsonwebtoken'
import { getConfig } from '@aeriajs/entrypoint'
import jwt from 'jsonwebtoken'

const getTokenConfig = async () => {
  const config = await getConfig()
  if( !config.secret ) {
    throw new Error('application secret is not set')
  }

  return {
    name: config.name,
    secret: config.secret,
    tokenExpiration: config.security.tokenExpiration,
  }
}

export const signToken = async ({ iat, exp, ...payload }: Record<string, unknown>, secret?: string | null, options?: SignOptions) => {
  const tokenConfig = await getTokenConfig()
  if( tokenConfig.name ) {
    payload.aud = tokenConfig.name
  }

  return jwt.sign(payload, secret || tokenConfig.secret, options || {
    expiresIn: tokenConfig.tokenExpiration,
  })
}

export const decodeToken = async <TToken>(token: string, secret?: string) => {
  const tokenConfig = await getTokenConfig()
  return jwt.verify(token, secret || tokenConfig.secret) as TToken
}

