import type { HTTPStatus } from './http.js'

export const ERROR_SYMBOL_DESCRIPTION = '#__ERROR_SYMBOL__' 
export const ERROR_SYMBOL = Symbol(ERROR_SYMBOL_DESCRIPTION)

export type Left<T> = {
  readonly _tag: 'Left'
  readonly value: T
}

export type Right<T> = {
  readonly _tag: 'Right'
  readonly value: T
}

export type EndpointErrorContent<
  TCode extends string = string,
  THTTPStatus extends HTTPStatus = HTTPStatus,
  TDetails extends Record<string, any> = Record<string, any>,
  TMessage extends string = string,
> = {
  code: TCode
  httpStatus?: THTTPStatus
  message?: TMessage
  details?: TDetails
}

export type EndpointError<TEndpointErrorContent extends EndpointErrorContent = EndpointErrorContent> = {
  value: TEndpointErrorContent
}

export type ExtractLeft<T> = T extends Left<infer L>
  ? L
  : never

export type ExtractRight<T> = T extends Right<infer R>
  ? R
  : never

export type ExtractError<T> = T extends EndpointError
  ? T
  : never

export type Either<L, R> = Left<L> | Right<R>

