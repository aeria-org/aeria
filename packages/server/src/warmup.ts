import type { RouteUri } from '@aeriajs/http'
import { getEndpoints } from '@aeriajs/api'

const ANSI_COLORS = {
  green: '\x1b[32m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
}

const METHOD_COLORS: Record<string, keyof typeof ANSI_COLORS> = {
  GET: 'green',
  PUT: 'blue',
  POST: 'white',
  DELETE: 'red',
}

const colorizedRoute = (
  method: string,
  endpointUri: string,
  roles?: string[],
) => {
  const color = method in METHOD_COLORS
    ? ANSI_COLORS[METHOD_COLORS[method]]
    : ANSI_COLORS.white

  let line = `\x1b[1m${color}${method}\x1b[0m\t\x1b[90m/api\x1b[0m`
  line += `\x1b[1m${endpointUri}\x1b[0m`

  if( roles ) {
    line += ` \x1b[90m[${roles.join('|')}]\x1b[0m`
  }

  return line
}

export const warmup = async () => {
  const endpoints = await getEndpoints()

  for( const endpointUri in endpoints ) {
    const endpoint = endpoints[endpointUri as RouteUri]

    for( const method in endpoint ) {
      const line = colorizedRoute(method, endpointUri, endpoint[method as keyof typeof endpoint]?.roles)
      console.log(line)
    }
  }
}

