import type { RequestConfig } from '@aeriajs/common'
import type { RequestMethod } from '@aeriajs/types'
import type { InstanceConfig } from './types.js'
import { authenticate, signout, type AuthenticationPayload } from './auth.js'
import { request } from './http.js'
import { apiUrl } from './utils.js'

type UserFunctions = {
  user: TLOFunctions & {
    authenticate: (payload: AuthenticationPayload)=> Promise<any>
    signout: ()=> Promise<void>
  }
}

export type TLOFunctions = {
  [P: string]: Record<RequestMethod, ((payload?: any)=> Promise<any>) & TLOFunctions>
}

export type TopLevelObject = UserFunctions & {
  describe: {
    POST: (...args: any)=> Promise<any>
  }
}

export const topLevel = (config: InstanceConfig) => {
  const proxify = (target: any, parent?: string): TopLevelObject => new Proxy<TopLevelObject>(target, {
    get: (_, key) => {
      if( typeof key === 'symbol' ) {
        return target[key]
      }

      switch( `${parent}/${key}` ) {
        case 'user/authenticate': return authenticate(config)
        case 'user/signout': return signout(config)
      }

      const endpoint = parent

      const fn = async (payload: any) => {
        const method = key as RequestMethod
        const requestConfig: RequestConfig = {
          params: {
            method,
          },
        }

        if( method !== 'GET' && method !== 'HEAD' ) {
          if( payload ) {
            requestConfig.params!.headers = {
              'content-type': 'application/json',
            }
          }
        }

        const response = await request(
          config,
          `${apiUrl(config)}/${endpoint}`,
          payload,
          requestConfig,
        )

        return response.data
      }

      const path = parent
        ? `${parent}/${key}`
        : key

      return proxify(fn, path)
    },
  })

  return proxify({})
}

