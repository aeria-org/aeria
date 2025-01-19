import type { ContractWithRoles, RouteUri } from '@aeriajs/types'
import { getEndpoints } from '@aeriajs/core'
import { getConfig, getAvailableRoles } from '@aeriajs/entrypoint'

type EscapeCode = `[${string}m`

const AnsiColor = {
  Green: '[32m',
  Yellow: '[33m',
  Blue: '[36m',
  Red: '[31m',
  White: '[37m',
} as const

const METHOD_COLORS: Record<string, typeof AnsiColor[keyof typeof AnsiColor]> = {
  GET: AnsiColor.Green,
  PUT: AnsiColor.Blue,
  POST: AnsiColor.White,
  DELETE: AnsiColor.Red,
}

const escape = (code: EscapeCode | EscapeCode[], text: string) => {
  const codeStr = Array.isArray(code)
    ? code.map((c) => `\x1b${c}`).join('')
    : `\x1b${code}`

  return `${codeStr}${text}\x1b[0m`
}

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

