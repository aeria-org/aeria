import type { EndpointError, EndpointErrorContent, RouteContext } from '@aeriajs/types'

export const error = <TEndpointErrorContent extends EndpointErrorContent>(error: TEndpointErrorContent, context: Pick<RouteContext, 'response'>) => {
  const { httpCode = 500 } = error

  context.response.writeHead(httpCode, {
    'content-type': 'application/json',
  })

  return <const>{
    _tag: 'Error',
    error,
  } satisfies EndpointError<TEndpointErrorContent>
}

export const isError = <TEndpointErrorContent extends EndpointErrorContent>(object: EndpointError<TEndpointErrorContent>): object is EndpointError<TEndpointErrorContent> => {
  return object._tag === 'Error'
}

