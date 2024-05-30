import type { EndpointError, EndpointErrorContent, HTTPStatus } from '@aeriajs/types'
import { ERROR_SYMBOL, ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'

export const error = <const TEndpointErrorContent extends EndpointErrorContent>(value: TEndpointErrorContent) => {
  const wrappedError = {
    [ERROR_SYMBOL]: true,
    value,
  }

  return wrappedError as EndpointError & {
    value: TEndpointErrorContent
  }
}

export const isError = <
  THTTPStatus extends HTTPStatus,
  TCode extends string,
>(object: EndpointError<EndpointErrorContent<TCode, THTTPStatus>> | Record<string, any>): object is EndpointError<EndpointErrorContent<TCode, THTTPStatus>> => {
  return ERROR_SYMBOL in object || ERROR_SYMBOL_DESCRIPTION in object
}

export const unwrapError = <TEndpointError extends EndpointError>(error: TEndpointError) => {
  return error.value
}

