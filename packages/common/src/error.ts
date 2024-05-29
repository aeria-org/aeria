import type { EndpointError, EndpointErrorContent } from '@aeriajs/types'
import { ERROR_SYMBOL } from '@aeriajs/types'

export const error = <TEndpointErrorContent extends EndpointErrorContent>(value: TEndpointErrorContent) => {
  return <const>{
    [ERROR_SYMBOL]: true,
    _tag: 'Error',
    value,
  } satisfies EndpointError<TEndpointErrorContent>
}

export const isError = (object: any): object is EndpointError => {
  return object && object._tag === 'Error'
}

export const isNativeError = (object: any): object is EndpointError => {
  return object && ERROR_SYMBOL in object
}

