import type { HTTPStatus } from './http.js'

export const ERROR_SYMBOL_DESCRIPTION = '#__ERROR_SYMBOL__'
export const ERROR_SYMBOL = Symbol(ERROR_SYMBOL_DESCRIPTION)

export type EndpointError<
  TCode extends string = string,
  TDetails = unknown,
  THTTPStatus extends HTTPStatus = HTTPStatus,
  TMessage extends string = string,
> = {
  code: TCode
  details?: TDetails
  httpStatus?: THTTPStatus
  message?: TMessage
}

export type StrictEndpointError<
  TCode extends string = string,
  TDetails = unknown,
  THTTPStatus extends HTTPStatus | undefined = HTTPStatus,
  TMessage extends string | undefined = string,
> = {
  code: TCode
  details?: TDetails
  httpStatus: THTTPStatus
  message?: TMessage
}

