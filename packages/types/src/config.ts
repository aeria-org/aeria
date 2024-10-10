import type { RouteContext } from './context.js'
import type { RouteUri } from './http.js'
import type { RateLimitingParams } from './security.js'
import type { CollectionItem } from './collection.js'

export type ApiConfig = {
  name?: string
  secret?: string
  baseUrl?: RouteUri
  publicUrl?: string
  host?: string
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
    tokenExpiration?: number
    logSuccessfulAuthentications?: boolean
    authenticationRateLimiting?: RateLimitingParams | null
    allowSignup?: boolean
    signupDefaults?: {
      roles?: string[]
      active?: boolean
    }
    paginationLimit?: number
    exposeFunctionsByDefault?:
      | boolean
      | 'unauthenticated'
  }
  tokenUserProperties?: (keyof CollectionItem<'user'>)[]
  errorHandler?: <TError>(
    context: RouteContext,
    error: TError
  )=> unknown | Promise<unknown>
}

