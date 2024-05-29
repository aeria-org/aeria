import type { HTTPStatus } from './http.js'

export const ERROR_SYMBOL = Symbol('ErrorSymbol')

export type Left<T> = {
  readonly _tag: 'Left'
  readonly value: T
}

export type Right<T> = {
  readonly _tag: 'Right'
  readonly value: T
}

export type EndpointErrorContent<
  THTTPStatus extends HTTPStatus = HTTPStatus,
  TCode extends string = string,
  TMessage extends string = string,
  TDetails extends Record<string, any> = Record<string, any>,
> = {
  httpStatus: THTTPStatus
  code: TCode
  message?: TMessage
  details?: TDetails
}

export type EndpointError<T extends EndpointErrorContent = EndpointErrorContent> = {
  readonly _tag: 'Error'
  readonly value: T
  [ERROR_SYMBOL]: true
}

export type ExtractLeft<T> = T extends Left<infer L>
  ? L
  : never

export type ExtractRight<T> = T extends Right<infer R>
  ? R
  : never

export type ExtractError<T> = T extends EndpointError<infer E>
  ? EndpointError<E>
  : never

export type Either<L, R> = Left<L> | Right<R>

