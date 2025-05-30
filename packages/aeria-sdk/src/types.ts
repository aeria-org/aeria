import type { RequestTransformer, ResponseTransformer } from '@aeriajs/common'
import type { InferProperty, InferProperties, PackReferences, Contract, ContractWithRoles, RequestMethod, WithACErrors } from '@aeriajs/types'

export type StorageStrategy =
  | 'none'
  | 'memo'
  | 'localStorage'

export type InstanceConfig = {
  publicUrl: string | {
    production: string
    development: string
  }
  storage?: {
    strategy?: StorageStrategy
    namespace?: string
  }
  environment?:
    | 'production'
    | 'development'
  integrated?: boolean
  mirrorPaths?: string[]
}

export type ApiPrototype =
  | { [node: string]: ApiPrototype }
  | Record<RequestMethod, (payload: unknown) => Promise<unknown>>

export type ApiSchema = {
  [route: string]: {
    [method: RequestMethod]: ContractWithRoles
  }
}

export type AeriaInstance = ApiPrototype & {
  describe: {
    POST: (...args: unknown[])=> Promise<string>
  }
}

export type InferEndpointFunction<TRouteResponse, TRoutePayload> = TRoutePayload extends null
  ? <T = TRouteResponse>(payload?: unknown)=> Promise<WithACErrors<T>>
  : TRoutePayload extends undefined
    ? <T = TRouteResponse>()=> Promise<WithACErrors<T>>
    : <T = TRouteResponse>(payload: TRoutePayload)=> Promise<WithACErrors<T>>

export type InferEndpointFromContract<TContract extends Contract> = TContract extends
  | { response: infer RouteResponse }
  | { payload: infer RoutePayload }
  | { query: infer RoutePayload }
  ? InferEndpointFunction<
    RouteResponse extends {}
      ? InferProperties<RouteResponse>
      : unknown,
    RoutePayload extends {}
      ? PackReferences<InferProperty<RoutePayload>>
      : undefined
  >
  : never

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

