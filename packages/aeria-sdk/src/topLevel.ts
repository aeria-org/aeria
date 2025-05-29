import type { RequestConfig, RequestTransformer, ResponseTransformer } from '@aeriajs/common'
import type { RequestMethod } from '@aeriajs/types'
import type { InstanceConfig } from './types.js'
import { request } from './http.js'
import { publicUrl } from './utils.js'

export type ApiPrototype =
  | { [node: string]: ApiPrototype }
  | Record<RequestMethod, (payload: unknown) => Promise<unknown>>

export type TopLevelObject = ApiPrototype & {
  describe: {
    POST: (...args: unknown[])=> Promise<string>
  }
}

export type InstanceContext = {
  interceptors: {
    request?: RequestTransformer
    response?: ResponseTransformer
  }
}

export const interceptors: InstanceContext['interceptors'] = {}

const proxify = <TTarget extends Function | Record<string | symbol, unknown>>(
  config: InstanceConfig,
  _target: TTarget,
  instanceContext: InstanceContext,
  bearerToken?: string,
  parent?: string,
) => {
  const {
    request: requestTransformer = interceptors.request,
    response: responseTransformer = interceptors.response,
  } = instanceContext.interceptors

  return new Proxy(_target as TTarget & ApiPrototype, {
    get: (target, key) => {
      if( typeof key === 'symbol' ) {
        return target[key as keyof typeof target]
      }

      const fn = async (payload: unknown) => {
        const method = key
        const requestConfig = {
          requestTransformer,
          responseTransformer,
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

      return proxify(config, fn, instanceContext, bearerToken, path)
    },
  })
}

export const createInstance = <TApiPrototype extends ApiPrototype>(config: InstanceConfig, instanceContext = {
  interceptors,
}) => {
  const fn = (bearerToken?: string) => {
    return proxify(config, {}, instanceContext, bearerToken) as TApiPrototype
  }

  return proxify(config, fn, instanceContext)
}

