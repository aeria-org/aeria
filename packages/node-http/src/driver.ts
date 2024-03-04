import http from 'http'
import { parse as parseUrl } from 'url'
import type { GenericRequest, GenericResponse, RequestMethod } from '@aeriajs/types'
import type { ServerOptions } from '@aeriajs/http'

const getBody = async ($req: http.IncomingMessage) => {
  const bodyParts: Buffer[] = []
  for await (const chunk of $req) {
    bodyParts.push(chunk)
  }

  return Buffer.concat(bodyParts).toString()
}

export const abstractRequest = async (request: http.IncomingMessage) => {
  const url = request.url || '/'

  const req: GenericRequest = {
    url,
    method: (request.method || '') as RequestMethod,
    headers: request.headers,
    body: request.headers['x-stream-request']
      ? undefined
      : await getBody(request),
    query: url.includes('?')
      ? parseUrl(url, true).query
      : {},
    payload: {},
    fragments: [],
    nodeRequest: request,
  }

  return req
}

export const abstractResponse = (response: http.ServerResponse): GenericResponse => {
  const { end } = response

  return Object.assign(response, <GenericResponse>{
    writeHead: response.writeHead.bind(response),
    setHeader: response.setHeader.bind(response),
    end: (value) => {
      if( typeof value === 'object' && !(value instanceof Buffer) ) {
        if( !response.headersSent ) {
          response.writeHead(200, {
            'content-type': 'application/json',
          })
        }

        return end.bind(response)(JSON.stringify(value))
      }

      const endVal = value instanceof Buffer
        ? value
        : String(value || '')

      return end.bind(response)(endVal)
    },
  })
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

