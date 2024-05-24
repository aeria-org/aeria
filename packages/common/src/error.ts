import type { EndpointError, RouteContext } from '@aeriajs/types'

export const error = (error: EndpointError, context: Pick<RouteContext, 'response'>) => {
  const { httpCode = 500 } = error

  context.response.writeHead(httpCode, {
    'content-type': 'application/json',
  })

  return <const>{
    $isError: true,
    error,
  }
}

export const isError = (object: any): object is EndpointError => {
  return object.$isError === true
}

