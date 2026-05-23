import type { CorsFunction } from '@aeriajs/types'

export const cors: CorsFunction = async (req, res, config) => {
  const {
    allowOrigin = [],
    allowMethods = [],
    allowHeaders = [],
    maxAge,
  } = config

  const headers = {
    'Access-Control-Allow-Origin': allowOrigin.join(','),
    'Access-Control-Allow-Methods': allowMethods.join(','),
    'Access-Control-Allow-Headers': allowHeaders.join(','),
    'Access-Control-Max-Age': maxAge,
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

