import type { ContractWithRoles, RouteUri } from '@aeriajs/types'
import { escape, AnsiColor, METHOD_COLORS } from '@aeriajs/common'
import { getEndpoints } from '@aeriajs/core'
import { getConfig, getAvailableRoles } from '@aeriajs/entrypoint'

const colorizedRoute = async (
  method: string,
  endpointUri: string,
  endpoint?: ContractWithRoles | null,
) => {
  const config = await getConfig()
  const color = method in METHOD_COLORS
    ? METHOD_COLORS[method]
    : AnsiColor.White

  let
    rolesLine = '',
    hasContractLine = escape(AnsiColor.Yellow, 'x')

  if( endpoint ) {
    if( 'roles' in endpoint ) {
      const roles = await (async () => {
        const availableRoles = await getAvailableRoles()

        switch( endpoint.roles ) {
          case false:
          case undefined:
            return []
          case true: return []
          case 'unauthenticated': return availableRoles
          case 'unauthenticated-only': return ['unauthenticated']
        }

        return endpoint.roles
      })()

      rolesLine = ` ${escape('[90m', `[${roles.join('|')}]`)}`
    }
    if( 'response' in endpoint || endpoint.builtin ) {
      hasContractLine = escape(AnsiColor.Green, '✓')
    }
  }

  let line = escape([
    '[1m',
    color,
  ], method) + '\t'

  line += hasContractLine
  line += escape('[90m', ` ${config.baseUrl === '/'
    ? ''
    : config.baseUrl!}`)
  line += escape('[1m', endpointUri)
  line += rolesLine

  return line
}

export const warmup = async () => {
  const endpoints = await getEndpoints()

  for( const endpointUri in endpoints ) {
    const endpoint = endpoints[endpointUri as RouteUri]

    for( const method in endpoint ) {
      const line = await colorizedRoute(method, endpointUri, endpoint[method])
      console.log(line)
    }
  }
}

