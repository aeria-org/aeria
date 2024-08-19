import type { GenericRequest, GenericResponse } from '@aeriajs/types'
import type { ServerOptions } from '@aeriajs/http'
import { ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'
import { isEndpointError } from '@aeriajs/common'
import * as http from 'http'
import { parse as parseUrl } from 'url'

const getBody = async ($req: http.IncomingMessage) => {
  const bodyParts: Buffer[] = []
  for await (const chunk of $req) {
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

export const abstractResponse = (response: http.ServerResponse): GenericResponse => {
  const { end } = response

  return Object.assign(response, {
    writeHead: response.writeHead.bind(response),
    setHeader: response.setHeader.bind(response),
    end: (value) => {
      if( value === undefined ) {
        return end.bind(response)()
      }

      if( typeof value === 'object' && !(value instanceof Buffer) ) {
        if( !response.headersSent ) {
          if( isEndpointError(value) ) {
            const { error } = value
            if( error.httpStatus ) {
              response.writeHead(error.httpStatus, {
                'content-type': 'application/json',
              })
            }

            Object.assign(value, {
              [ERROR_SYMBOL_DESCRIPTION]: true,
            })
          } else {
            response.writeHead(200, {
              'content-type': 'application/json',
            })
          }
        }

        return end.bind(response)(JSON.stringify(value))
      }

      const endVal = value instanceof Buffer
        ? value
        : String(value)

      return end.bind(response)(endVal)
    },
  } satisfies Partial<GenericResponse>)
}

const abstractTransaction = async ($req: http.IncomingMessage, $res: http.ServerResponse) => {
  const req = await abstractRequest($req)
  const res = abstractResponse($res)

  return {
    req,
    res,
  }
}

export const registerServer = (options: ServerOptions, cb: (req: GenericRequest, res: GenericResponse)=> void | Promise<void>) => {
  const server = http.createServer(async ($req, $res) => {
    const {
      req,
      res,
    } = await abstractTransaction($req, $res)

    cb(req, res)
  })

  return {
    server,
    listen: () => server.listen(options.port, options.host),
  }
}

