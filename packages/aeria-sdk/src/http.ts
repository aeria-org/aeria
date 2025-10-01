import type { TokenBase } from '@aeriajs/types'
import type { InstanceConfig } from './types.js'
import { request as originalRequest, type RequestTransformerContext, type RequestTransformerNext, type RequestConfig } from '@aeriajs/common'
import { getStorage } from './storage.js'
import { jwtDecode } from 'jwt-decode'

const sdkRequestTransformer = (config: InstanceConfig, next: RequestTransformerNext) => (context: RequestTransformerContext) => {
  const params = Object.assign({
    headers: {},
  }, context.params)

  const storage = getStorage(config)
  const auth = storage.get('auth')

  let hasError = false

  if( auth ) {
    if( auth.token.type.includes('bearer') ) {
      let decoded: Required<TokenBase> | undefined
      try {
        decoded = jwtDecode<NonNullable<typeof decoded>>(auth.token.content)

      } catch( err ) {
        console.trace(err)
      }

      if( !decoded || Date.now() >= decoded.exp * 1000 ) {
        storage.remove('auth')
        hasError = true
      }
    }

    if( !hasError && !params.headers.authorization ) {
      switch( auth.token.type ) {
        case 'bearer': {
          params.headers.authorization = `Bearer ${auth.token.content}`
          break
        }
      }
    }

  }

  context.params = params
  return next(context)
}

export const request = <TResponseType = unknown>(config: InstanceConfig, url: string, payload?: unknown, _requestConfig?: RequestConfig) => {
  const requestConfig = Object.assign({}, _requestConfig)
  const { requestTransformer: userDefinedRequestTransformer } = requestConfig

  if( userDefinedRequestTransformer ) {
    requestConfig.requestTransformer = (context, next) => {
      return userDefinedRequestTransformer(context, sdkRequestTransformer(config, next))
    }
  } else {
    requestConfig.requestTransformer = (context, next) => {
      return sdkRequestTransformer(config, next)(context)
    }
  }

  return originalRequest<TResponseType>(url, payload, requestConfig)
}

