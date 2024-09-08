import type { RouteContext } from './context.js'
import type { RouteUri } from './http.js'
import type { RateLimitingParams } from './security.js'

export type ApiConfig = {
  secret?: string
  baseUrl?: RouteUri
  publicUrl?: string
  port?: number
  defaultPaginationLimit?: number
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
    paginationLimit?: number
    exposeFunctionsByDefault?:
      | boolean
      | 'unauthenticated'
  }
  tokenUserProperties?: string[]
  errorHandler?: <TError>(
    context: RouteContext,
    error: TError
  )=> unknown | Promise<unknown>
}

