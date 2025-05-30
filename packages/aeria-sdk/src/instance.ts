import type { RequestConfig } from '@aeriajs/common'
import type { InstanceConfig, InstanceContext, ApiPrototype, ApiSchema, InferEndpointFromContract } from './types.js'
import { request } from './http.js'
import { publicUrl } from './utils.js'

export const interceptors: InstanceContext['interceptors'] = {}

const proxify = <TTarget extends Function | Record<string | symbol, unknown>>(
  config: InstanceConfig,
  _target: TTarget,
  context: InstanceContext,
  bearerToken?: string,
  segment?: string,
) => {
  return new Proxy(_target as TTarget & ApiPrototype, {
    get: (target, key) => {
      if( typeof key === 'symbol' ) {
        return target[key as keyof typeof target]
      }

      const uri = segment
        ? segment
        : key

      const newUri = segment
        ? `${segment}/${key}`
        : key

      const fn = call()(key, uri, {
        config,
        context,
        bearerToken,
      })

      return proxify(config, fn, context, bearerToken, newUri)
    },
  })
}

export const call = <TApiSchema extends ApiSchema>() => <TRoute extends keyof TApiSchema, TRouteMethod extends keyof TApiSchema[TRoute]>(
  method: TRouteMethod & string,
  route: TRoute & string,
  params: {
    config: InstanceConfig
    context?: InstanceContext
    bearerToken?: string
  }
) => {
  const { context = { interceptors } } = params
  const {
    request: requestTransformer = interceptors.request,
    response: responseTransformer = interceptors.response,
  } = context.interceptors

  const fn = async (payload: unknown) => {
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

    if( params.bearerToken ) {
      requestConfig.params.headers.authorization = `Bearer ${params.bearerToken}`
    }

    const { data } = await request(params.config, `${publicUrl(params.config)}/${route}`, payload, requestConfig)
    return data
  }

  return fn as InferEndpointFromContract<TApiSchema[TRoute][TRouteMethod]>
}

export const createInstance = <TApiPrototype extends ApiPrototype>(config: InstanceConfig, instanceContext = {
  interceptors,
}) => {
  const fn = (bearerToken?: string) => {
    return proxify(config, {}, instanceContext, bearerToken) as TApiPrototype
  }

  return proxify(config, fn, instanceContext)
}

