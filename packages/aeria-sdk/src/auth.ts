import type { InstanceConfig } from './types.js'
import { Result } from '@aeriajs/types'
import { request } from './http.js'
import { publicUrl } from './utils.js'
import { getStorage } from './storage.js'

export type AuthenticationResult = {
  user: Collections['user']['item']
  token: {
    type: 'bearer'
    content: string
  }
}

export type AuthenticationPayload = {
  email: string
  password: string
}

export const authenticate = (config: InstanceConfig) => async (payload: AuthenticationPayload) => {
  const response = await request<Result.Either<unknown, AuthenticationResult>>(config, `${publicUrl(config)}/user/authenticate`, payload)
  const { error, result } = response.data
  if( result ) {
    getStorage(config).set('auth', result)
  }

  return Result.error(error)
}

export const signout = (config: InstanceConfig) => async () => {
  getStorage(config).remove('auth')
}

