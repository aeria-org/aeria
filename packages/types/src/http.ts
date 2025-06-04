import type { ServerResponse, IncomingMessage } from 'http'
import type { Result, ExtractError, ExtractResult } from './result.js'
import type { EndpointError } from './endpointError.js'
import type { ACError } from './accessControl.js'
import type { RateLimitingError } from './security.js'

export const REQUEST_METHODS = [
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

export const METHOD_COLORS = {
  GET: 'green',
  PUT: 'blue',
  POST: 'white',
  DELETE: 'red',
} as const satisfies Record<RequestMethod, string>

export const HTTPStatus = {
  Ok: 200,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  RangeNotSatisfiable: 416,
  UnprocessableContent: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
} as const

export type RouteUri = `/${string}`

export type RequestMethod = string

export type GenericRequest = Omit<
  IncomingMessage,
  | 'url'
  | 'method'
> & {
  readonly url: string
  readonly method: RequestMethod
  readonly body?: string
  readonly fragments: string[]
  payload: Record<string, unknown>
  query: Record<string, unknown>
}

export const STREAMED_RESPONSE = Symbol('StreamedResponse')

export type GenericResponse = ServerResponse & {
  [STREAMED_RESPONSE]?: boolean
}

type ExtractCode<TRouteResponse> = TRouteResponse extends EndpointError<infer PCode>
  ? PCode
  : never

type ExtractHTTPStatus<TRouteResponse> = TRouteResponse extends EndpointError<string, unknown, infer PHTTPStatus>
  ? PHTTPStatus
  : never

export type NativeError =
  | typeof ACError.AuthenticationError
  | typeof ACError.AuthorizationError
  | typeof RateLimitingError.LimitReached
  | typeof RateLimitingError.Unauthenticated

export type NativeHTTPErrorStatus =
  | typeof HTTPStatus.Unauthorized
  | typeof HTTPStatus.TooManyRequests

export type WithACErrors<TRouteResponse> = TRouteResponse extends Result.Either<infer InferredError, unknown>
  ? Result.Either<
    | ExtractError<TRouteResponse>
    | EndpointError<
      | ExtractCode<InferredError>
      | NativeError,
      unknown,
      | ExtractHTTPStatus<InferredError>
      | NativeHTTPErrorStatus
    >,
    ExtractResult<TRouteResponse>
  >
  : TRouteResponse | Result.Error<
    EndpointError<
      NativeError,
      unknown,
      NativeHTTPErrorStatus
    >
  >

