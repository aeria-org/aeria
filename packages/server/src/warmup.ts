import type { ContractWithRoles, RouteUri } from '@aeriajs/types'
import { getEndpoints } from '@aeriajs/api'
import { getConfig } from '@aeriajs/entrypoint'

type EscapeCode = `[${string}m`

enum AnsiColors {
  Green = '[32m',
  Yellow = '[33m',
  Blue = '[36m',
  Red = '[31m',
  White = '[37m',
}

const METHOD_COLORS: Record<string, AnsiColors> = {
  GET: AnsiColors.Green,
  PUT: AnsiColors.Blue,
  POST: AnsiColors.White,
  DELETE: AnsiColors.Red,
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
    : AnsiColors.White

  let
    rolesLine = '',
    hasContractLine = escape(AnsiColors.Yellow, 'x')

  if( endpoint ) {
    if( endpoint.roles ) {
      rolesLine = ` ${escape('[90m', `[${endpoint.roles.join('|')}]`)}`
    }
    if( 'response' in endpoint || endpoint.builtin ) {
      hasContractLine = escape(AnsiColors.Green, '✓')
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
      const line = await colorizedRoute(method, endpointUri, endpoint[method as keyof typeof endpoint])
      console.log(line)
    }
  }
}

