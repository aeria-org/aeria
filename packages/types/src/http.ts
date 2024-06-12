import type { ServerResponse, IncomingMessage } from 'http'
import type { MapSchemaUnion } from './schema.js'
import type { ExtractError, ExtractResult, Result } from './result.js'
import type { EndpointError, StrictEndpointError } from './endpointError.js'
import type { ACError } from './accessControl.js'
import type { RateLimitingError } from './security.js'

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

export enum HTTPStatus {
  Ok = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  UnprocessableContent = 422,
  TooManyRequests = 429,
  InternalServerError = 500,
}

export type RouteUri = `/${string}`

export type RequestMethod = (typeof REQUEST_METHODS)[number]

export type GenericRequest = {
  url: string
  method: RequestMethod
  headers: Record<string, string | string[] | undefined>
  body?: string
  query: Record<string, any>
  payload: Record<string, any>
  fragments: string[]
  nodeRequest: IncomingMessage
}

export type GenericResponse = ServerResponse

type ExtractCode<TRouteResponse> = TRouteResponse extends Result.Error<EndpointError<infer PCode>>
  ? PCode
  : never

type ExtractHTTPStatus<TRouteResponse> = TRouteResponse extends Result.Error<EndpointError<any, unknown, infer PHTTPStatus>>
  ? PHTTPStatus
  : never

export type WithACErrors<TRouteResponse> =
  Result.Either<
    | ExtractError<TRouteResponse>
    | StrictEndpointError<
    | ExtractCode<TRouteResponse>
      | ACError.AuthenticationError
      | ACError.AuthorizationError
      | RateLimitingError.LimitReached
      | RateLimitingError.Unauthenticated,
      unknown,
      | ExtractHTTPStatus<TRouteResponse>
      | HTTPStatus.Unauthorized
      | HTTPStatus.TooManyRequests
    >,
    ExtractResult<TRouteResponse>
  >

export type EndpointFunction<
  TRouteMethod extends RequestMethod,
  TRouteResponse,
  TRoutePayload,
> = (
  TRoutePayload extends null
    ? (payload?: any)=> Promise<WithACErrors<TRouteResponse>>
    : TRoutePayload extends undefined
      ? ()=> Promise<WithACErrors<TRouteResponse>>
      : (payload: TRoutePayload)=> Promise<WithACErrors<TRouteResponse>>
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

