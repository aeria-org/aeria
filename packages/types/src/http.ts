import type { ServerResponse, IncomingMessage } from 'http'
import type { MapSchemaUnion } from './schema'

export const REQUEST_METHODS = <const>[
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH',
  'TRACE',
  'SEARCH',
]

export type RequestMethod = (typeof REQUEST_METHODS)[number]

export type GenericRequest = {
  url: string
  method: RequestMethod
  headers: Record<string, any>
  body?: string
  query: Record<string, any>
  payload: Record<string, any>
  fragments: string[]
  nodeRequest: IncomingMessage
}

export type GenericResponse = ServerResponse

export type EndpointFunction<
  TRouteMethod extends RequestMethod,
  TRouteResponse,
  TRoutePayload,
> = (
  TRoutePayload extends null
    ? (payload?: any)=> Promise<TRouteResponse>
    : TRoutePayload extends undefined
      ? ()=> Promise<TRouteResponse>
      : (payload: TRoutePayload)=> Promise<TRouteResponse>
) extends infer Function
  ? Record<TRouteMethod, Function>
  : never

export type MakeEndpoint<
  TRoute extends string,
  TRouteMethod extends RequestMethod,
  TRouteResponse = any,
  TRoutePayload = null,
> = TRoute extends `/${infer RouteTail}`
  ? MakeEndpoint<RouteTail, TRouteMethod, TRouteResponse, TRoutePayload>
  : TRoute extends `${infer Route}/${infer RouteTail}`
    ? Record<Route, MakeEndpoint<RouteTail, TRouteMethod, TRouteResponse, TRoutePayload>>
    : TRoute extends `(${string}`
      ? Record<string, EndpointFunction<TRouteMethod, TRouteResponse, TRoutePayload>>
      : Record<TRoute, EndpointFunction<TRouteMethod, TRouteResponse, TRoutePayload>>

type UnwrapResponse<TResponse> = TResponse extends readonly any[]
  ? TResponse
  : TResponse[]

export type InferResponse<TResponse> = MapSchemaUnion<UnwrapResponse<TResponse>> extends infer InferredResponse
  ? InferredResponse | Promise<InferredResponse>
  : never

