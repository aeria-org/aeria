import type { GenericRequest, GenericResponse } from '@aeriajs/types'

export const cors = (req: GenericRequest, res: GenericResponse) => {
  const allowedHeaders = [
    'Accept',
    'Accept-Version',
    'Authorization',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'X-Stream-Request',
  ]

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': allowedHeaders.join(','),
    'Access-Control-Max-Age': '2592000',
  }

  if( req.method === 'OPTIONS' ) {
    res.writeHead(204, headers)
    res.end()
    return null
  }

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}
