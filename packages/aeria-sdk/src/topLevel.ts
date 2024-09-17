import type { RequestConfig } from '@aeriajs/common'
import type { InstanceConfig } from './types.js'
import { request } from './http.js'
import { publicUrl } from './utils.js'

export type TopLevelObject = {
  describe: {
    POST: (...args: unknown[])=> Promise<string>
  }
}

const proxify = <TTarget extends Function | Record<string | symbol, unknown>>(
  config: InstanceConfig,
  _target: TTarget,
  bearerToken?: string,
  parent?: string,
) => {
  return new Proxy(_target as TTarget & TopLevelObject, {
    get: (target, key) => {
      if( typeof key === 'symbol' ) {
        return target[key as keyof typeof target]
      }

      const fn = async (payload: unknown) => {
        const method = key
        const requestConfig = {
          params: {
            method,
            headers: {} as Record<string, string>,
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

