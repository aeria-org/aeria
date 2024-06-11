import type { InstanceConfig } from './types.js'
import { left } from '@aeriajs/common'
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

export const authMemo = {} as AuthenticationResult

export const authenticate = (config: InstanceConfig) => async (payload: AuthenticationPayload) => {
  const response = await request(config, `${publicUrl(config)}/user/authenticate`, payload)
  const { error, value: result } = response.data
  if( result ) {
    getStorage(config).set('auth', result)
  }

  return left(error)
}

export const signout = (config: InstanceConfig) => async () => {
  getStorage(config).remove('auth')
}

