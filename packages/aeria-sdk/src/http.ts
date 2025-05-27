import type { InstanceConfig } from './types.js'
import { request as originalRequest, type RequestConfig } from '@aeriajs/common'
import { getStorage } from './storage.js'

export const request = <TResponseType = unknown>(config: InstanceConfig, url: string, payload?: unknown, _requestConfig?: RequestConfig) => {
  const requestConfig = Object.assign({}, _requestConfig)
  requestConfig.requestTransformer ??= async (context, next) => {
    const params = Object.assign({
      headers: {},
    }, context.params)

    const auth = getStorage(config).get('auth')

    if( auth?.token && !params.headers.authorization ) {
      switch( auth.token.type ) {

        case 'bearer': {
          params.headers.authorization = `Bearer ${auth.token.content}`
          break
        }
      }
    }

    return next({
      ...context,
      params,
    })
  }

  return originalRequest<TResponseType>(url, payload, requestConfig)
}

