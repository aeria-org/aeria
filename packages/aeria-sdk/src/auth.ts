import type { InstanceConfig } from './types.js'
import { isRight, unwrapEither } from '@aeriajs/common'
import { request } from './http.js'
import { apiUrl } from './utils.js'
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

export const authMemo = {} as AuthenticationResult

export const authenticate = (config: InstanceConfig) => async (payload: AuthenticationPayload) => {
  const response = await request(config, `${apiUrl(config)}/user/authenticate`, payload)
  const resultEither = response.data
  if( isRight(resultEither) ) {
    const result = unwrapEither(resultEither)
    getStorage(config).set('auth', result)
  }

  return resultEither
}

export const signout = (config: InstanceConfig) => async () => {
  getStorage(config).remove('auth')
}
