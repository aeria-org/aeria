import { promisify } from 'util'
import { getConfig } from '@aeriajs/entrypoint'
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

const asyncSign = promisify<string | object | Buffer, Secret, SignOptions>(jwt.sign)
const asyncVerify = promisify<string, Secret, any>(jwt.verify)

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

  const signed = asyncSign(payload, secret || fallbackSecret, options || {
    expiresIn: EXPIRES_IN,
  }) as unknown

  return signed as Promise<string>
}

export const verifyToken = async (token: string, secret?: string) => {
  const fallbackSecret = await getApplicationSecret()
  return asyncVerify(token, secret || fallbackSecret)
}

export const decodeToken = (token: string, secret?: string) => {
  return verifyToken(token, secret)
}
