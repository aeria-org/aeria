import type { RequestConfig, RequestTransformer, ResponseTransformer } from '@aeriajs/common'
import type { ContractWithRoles, RequestMethod, InferEndpointFunction, InferEndpointFromContract } from '@aeriajs/types'
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

export type ApiSchema = {
  [route: string]: {
    [method: RequestMethod]: ContractWithRoles
  }
}

export type MakeEndpoint<
  TRoute extends string,
  TRouteMethod extends RequestMethod,
  TRouteResponse = unknown,
  TRoutePayload = null,
> = TRoute extends `/${infer RouteTail}`
  ? MakeEndpoint<RouteTail, TRouteMethod, TRouteResponse, TRoutePayload>
  : TRoute extends `${infer Route}/${infer RouteTail}`
    ? Record<Route, MakeEndpoint<RouteTail, TRouteMethod, TRouteResponse, TRoutePayload>>
    : TRoute extends `(${string}`
      ? Record<string, Record<TRouteMethod, InferEndpointFunction<TRouteResponse, TRoutePayload>>>
      : Record<TRoute, Record<TRouteMethod, InferEndpointFunction<TRouteResponse, TRoutePayload>>>

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

      const fn = call()(key, uri, config, instanceContext)
      return proxify(config, fn, instanceContext, bearerToken, newUri)
    },
  })
}

export const call = <TApiSchema extends ApiSchema>() => <TRoute extends keyof TApiSchema, TRouteMethod extends keyof TApiSchema[TRoute]>(
  method: TRouteMethod & string,
  route: TRoute & string,
  config: InstanceConfig,
  context: InstanceContext = {
    interceptors,
  },
  bearerToken?: string,
) => {
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

    if( bearerToken ) {
      requestConfig.params.headers.authorization = `Bearer ${bearerToken}`
    }

    const { data } = await request(config, `${publicUrl(config)}/${route}`, payload, requestConfig)
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

