import type { EndpointError, EndpointErrorContent, RouteContext } from '@aeriajs/types'

export const error = <TEndpointErrorContent extends EndpointErrorContent>(value: TEndpointErrorContent, context: Pick<RouteContext, 'response'>) => {
  const { httpStatus = 500 } = value

  context.response.writeHead(httpStatus, {
    'content-type': 'application/json',
  })

  return <const>{
    _tag: 'Error',
    value,
  } satisfies EndpointError<TEndpointErrorContent>
}

export const isError = (object: any): object is EndpointError<any> => {
  return object._tag === 'Error'
}

