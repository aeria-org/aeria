import type { EndpointError, RouteContext } from '@aeriajs/types'

export const endpointError = (error: EndpointError, context: Pick<RouteContext, 'response'>) => {
  const {
    httpCode = 500,
  } = error

  context.response.writeHead(httpCode, {
    'content-type': 'application/json'
  })

  return error
}

