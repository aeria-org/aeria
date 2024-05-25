import type { RouteContext } from './context.js'
import type { RouteUri } from './http.js'
import type { RateLimitingParams } from './security.js'

export type ApiConfig = {
  secret?: string
  baseUrl?: RouteUri
  publicUrl?: string
  port?: number
  paginationLimit?: number
  database?: {
    mongodbUrl?: string
    noDatabase?: boolean
    logQueries?: boolean
  }
  storage?: {
    fs?: string
    tempFs?: string
  }
  defaultUser?: {
    username: string
    password: string
  }
  security: {
    logSuccessfulAuthentications?: boolean
    authenticationRateLimiting?: RateLimitingParams | null
    allowSignup?: boolean
    signupDefaults?: Partial<{
      roles: string[]
      active: boolean
    }>
    exposeFunctionsByDefault?:
      | boolean
      | 'unauthenticated'
  }
  tokenUserProperties?: string[]
  errorHandler?: <TError extends Error>(
    context: RouteContext,
    error: TError
  )=> any | Promise<any>
}

