import type { RequestConfig } from '@aeriajs/common'
import type { InstanceConfig } from './types.js'
import { request } from './http.js'
import { publicUrl } from './utils.js'

export type TopLevelObject = {
  describe: {
    POST: (...args: any)=> Promise<any>
  }
}

const proxify = <TTarget extends ((...args: any)=> any) | Record<string | symbol, unknown>>(
  config: InstanceConfig,
  _target: TTarget,
  bearerToken?: string,
  parent?: string,
): TTarget & TopLevelObject => {
  return new Proxy(_target as any, {
    get: (target, key) => {
      if( typeof key === 'symbol' ) {
        return target[key]
      }

      const fn = async (payload: any) => {
        const method = key
        const requestConfig = {
          params: {
            method,
            headers: {} as Record<string, any>,
          },
        } satisfies RequestConfig

        if( method !== 'GET' && method !== 'HEAD' ) {
          if( payload ) {
            requestConfig.params.headers = {
              'content-type': 'application/json',
            }
          }
        }

        if( bearerToken ) {
          requestConfig.params.headers.authorization = `Bearer ${bearerToken}`
        }

        const response = await request(
          config,
          `${publicUrl(config)}/${parent}`,
          payload,
          requestConfig,
        )

        return response.data
      }

      const path = parent
        ? `${parent}/${key}`
        : key

      return proxify(config, fn, bearerToken, path)
    },
  })
}

export const topLevel = (config: InstanceConfig) => {
  const fn = (bearerToken?: string): TopLevelObject => {
    return proxify(config, {}, bearerToken)
  }

  return proxify(config, fn)
}

