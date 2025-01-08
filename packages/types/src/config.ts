import type { RouteContext } from './context.js'
import type { RouteUri } from './http.js'
import type { RateLimitingParams } from './security.js'
import type { CollectionItem } from './collection.js'
import type { UserRole } from './token.js'

export type RolesHierarchy = Record<
  UserRole,
  readonly UserRole[] | boolean
>

export type ApiConfig = {
  name?: string
  secret?: string
  baseUrl?: RouteUri
  publicUrl?: string
  webPublicUrl?: string
  host?: string
  port?: number
  defaultPaginationLimit?: number
  noWarmup?: boolean
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
    tokenExpiration?: number | undefined
    linkTokenExpiration?: number | undefined
    logSuccessfulAuthentications?: boolean
    authenticationRateLimiting?: RateLimitingParams | null
    allowSignup?: boolean
    mutableUserProperties: (keyof CollectionItem<'user'>)[]
    signupDefaults?: {
      roles?: string[]
      active?: boolean
    }
    paginationLimit?: number
    exposeFunctionsByDefault?:
      | boolean
      | 'unauthenticated'
    rolesHierarchy?: RolesHierarchy
  }
  tokenUserProperties?: (keyof CollectionItem<'user'>)[]
  errorHandler?: <TError>(
    context: RouteContext,
    error: TError
  )=> unknown | Promise<unknown>
}

