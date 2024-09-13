import type { EndpointError } from '@aeriajs/types'
import { Result, ERROR_SYMBOL, ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'
import { isError } from './result.js'

export const endpointError = <const TEndpointError extends EndpointError>(value: TEndpointError) => {
  return Result.error(Object.assign({
    [ERROR_SYMBOL]: true,
  }, value) as TEndpointError)
}

export const isEndpointError = (object: EndpointError | unknown): object is Result.Error<EndpointError> => {
  return !!(
    isError(object)
    && object.error
    && typeof object.error === 'object'
    && (ERROR_SYMBOL in object.error || ERROR_SYMBOL_DESCRIPTION in object.error)
  )
}

