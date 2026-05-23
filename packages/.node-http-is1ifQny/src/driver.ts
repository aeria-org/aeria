import type { GenericRequest, GenericResponse, ServerOptions } from '@aeriajs/types'
import { logResponse } from '@aeriajs/http'
import { ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'
import { isEndpointError } from '@aeriajs/common'
import * as http from 'node:http'
import { parse as parseUrl } from 'node:url'

const getBody = async (request: http.IncomingMessage) => {
  const bodyParts: Buffer[] = []
  for await (const chunk of request) {
    bodyParts.push(chunk)
  }

  return Buffer.concat(bodyParts).toString()
}

export const abstractRequest = async (request: http.IncomingMessage) => {
  if( !request.url || !request.method ) {
    throw new Error
  }

  const url = request.url

  const req: GenericRequest = Object.assign(request, {
    url,
    method: request.method,
    headers: request.headers,
    body: request.headers['x-stream-request']
      ? undefined
      : await getBody(request),
    query: url.includes('?')
      ? parseUrl(url, true).query
      : {},
    payload: {},
    fragments: [],
  })

  return req
}

export const abstractResponse = (response: http.ServerResponse, options: ServerOptions): GenericResponse => {
  const { end } = response

  return Object.assign(response, {
    writeHead: response.writeHead.bind(response),
    setHeader: response.setHeader.bind(response),
    end: (value) => {
      if( value === undefined ) {
        if( options.enableLogging ) {
          logResponse(response)
        }
        return end.bind(response)()
      }

      if( typeof value === 'object' && !(value instanceof Buffer) ) {
        if( !response.headersSent ) {
          if( isEndpointError(value) ) {
            const { error } = value
            response.writeHead(error.httpStatus, {
              'content-type': 'application/json',
            })

            Object.assign(value, {
              [ERROR_SYMBOL_DESCRIPTION]: true,
            })
          } else {
            response.writeHead(200, {
              'content-type': 'application/json',
            })
          }
        }

        if( options.enableLogging ) {
          logResponse(response)
        }
        return end.bind(response)(JSON.stringify(value))
      }

      const endVal = value instanceof Buffer
        ? value
        : String(value)

      if( options.enableLogging ) {
        logResponse(response)
      }
      return end.bind(response)(endVal)
    },
  } satisfies Partial<GenericResponse>)
}

const abstractTransaction = async (request: http.IncomingMessage, response: http.ServerResponse, options: ServerOptions) => {
  const req = await abstractRequest(request)
  const res = abstractResponse(response, options)

  return {
    req,
    res,
  }
}

export const registerServer = (options: ServerOptions, cb: (req: GenericRequest, res: GenericResponse)=> void | Promise<void>) => {
  const server = http.createServer(async (request, response) => {
    const {
      req,
      res,
    } = await abstractTransaction(request, response, options)

    cb(req, res)
  })

  return {
    server,
    listen: () => server.listen(options.port, options.host),
  }
}

