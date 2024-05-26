import type { EndpointError, EndpointErrorContent, RouteContext } from '@aeriajs/types'

export const error = <TEndpointErrorContent extends EndpointErrorContent>(error: TEndpointErrorContent, context: Pick<RouteContext, 'response'>) => {
  const { httpStatus = 500 } = error

  context.response.writeHead(httpStatus, {
    'content-type': 'application/json',
  })

  return <const>{
    _tag: 'Error',
    error,
  } satisfies EndpointError<TEndpointErrorContent>
}

export const isError = (object: any): object is EndpointError<any> => {
  return object._tag === 'Error'
}

