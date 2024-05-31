import type { EndpointError, EndpointErrorContent } from '@aeriajs/types'
import { ERROR_SYMBOL, ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'

export const error = <const TEndpointErrorContent extends EndpointErrorContent>(value: TEndpointErrorContent) => {
  const wrappedError = {
    [ERROR_SYMBOL]: true,
    _tag: 'Error',
    value,
  }

  return wrappedError as EndpointError & {
    value: TEndpointErrorContent
  }
}

export const isError = <TEndpointErrorContent extends EndpointErrorContent>(
  object: EndpointError<TEndpointErrorContent> | any,
): object is EndpointError<TEndpointErrorContent> => {
  return object
    && typeof object === 'object'
    && (ERROR_SYMBOL in object || ERROR_SYMBOL_DESCRIPTION in object)
}

export const unwrapError = <TEndpointErrorContent extends EndpointErrorContent>(error: EndpointError<TEndpointErrorContent>) => {
  return error.value
}

