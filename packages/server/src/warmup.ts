import { METHOD_COLORS, type ContractWithRoles, type RouteUri } from '@aeriajs/types'
import { getEndpoints } from '@aeriajs/core'
import { getConfig, getAvailableRoles } from '@aeriajs/entrypoint'
import { styleText } from 'node:util'

const colorizedRoute = async (
  method: string,
  endpointUri: string,
  endpoint?: ContractWithRoles | null,
) => {
  const config = await getConfig()
  const color = method in METHOD_COLORS
    ? METHOD_COLORS[method as keyof typeof METHOD_COLORS]
    : 'white'

  let
    rolesLine = '',
    hasContractLine = styleText(['yellow'], 'x')

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

      rolesLine = ` ${styleText(['grey'], `[${roles.join('|')}]`)}`
    }
    if( 'response' in endpoint || endpoint.builtin ) {
      hasContractLine = styleText(['green'], '✓')
    }
  }

  let line = styleText([ 'bold', color, ], method) + '\t'
  line += hasContractLine
  line += styleText(['grey'], ` ${config.baseUrl === '/' ? '' : config.baseUrl!}`)
  line += styleText(['bold'], endpointUri)
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

