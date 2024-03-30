import type { RouteContext, RouteUri, RateLimitingParams } from '.'

export type ApiConfig = {
  secret?: string
  apiUrl?: string
  apiBase?: RouteUri
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
  allowSignup?: boolean
  signupDefaults?: Partial<{
    roles: string[]
    active: boolean
  }>
  security?: {
    logSuccessfulAuthentications?: boolean
    authenticationRateLimiting?: RateLimitingParams | null
  }
  tokenUserProperties?: string[]
  errorHandler?: <TError extends Error>(
    context: RouteContext,
    error: TError
  )=> any | Promise<any>
}

