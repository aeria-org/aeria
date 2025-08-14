import type { SignOptions, VerifyErrors } from 'jsonwebtoken'
import { getConfig } from '@aeriajs/entrypoint'
import { Result } from '@aeriajs/types'
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

  const tokenOptions: SignOptions = options || {}
  if( !options ) {
    if( tokenConfig.tokenExpiration ) {
      tokenOptions.expiresIn = tokenConfig.tokenExpiration
    }
  }

  try {
    const result = jwt.sign(payload, secret || tokenConfig.secret, tokenOptions)
    return Result.result(result)
  } catch( err ) {
    return Result.error(err as VerifyErrors)
  }
}

export const decodeToken = async <TToken>(token: string, secret?: string) => {
  const tokenConfig = await getTokenConfig()
  try {
    const result = jwt.verify(token, secret || tokenConfig.secret) as TToken
    return Result.result(result)
  } catch( err ) {
    return Result.error(err as VerifyErrors)
  }
}

