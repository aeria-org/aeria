import type { RouteContext } from './context.js'
import type { GenericRequest, GenericResponse, RouteUri } from './http.js'
import type { RateLimitingParams } from './security.js'
import type { CollectionItem } from './collection.js'
import type { Token, UserRole } from './token.js'
import type { Result } from './result.js'

export type RolesHierarchy = Record<
  UserRole,
  readonly UserRole[] | boolean
>

export type CorsConfig = {
  allowOrigin?: readonly string[]
  allowMethods?: readonly string[]
  allowHeaders?: readonly string[]
  maxAge: string
}

export type GetTokenFunction = (request: GenericRequest, context: RouteContext) => Promise<Result.Either<unknown, Token>>

export type CorsFunction = (req: GenericRequest, res: GenericResponse, config: CorsConfig) => Promise<null | undefined>

export type ServerOptions = {
  host?: string
  port?: number
  enableLogging?: boolean
  noWarmup?: boolean
  cors?:
    | null
    | CorsConfig
    | CorsFunction
  getToken?: GetTokenFunction
}

export type ApiConfig = {
  name?: string
  secret?: string
  baseUrl?: RouteUri
  publicUrl?: string
  webPublicUrl?: string
  defaultPaginationLimit?: number
  server?: ServerOptions
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
      roles?: readonly UserRole[]
      active?: boolean
    }
    paginationLimit?: number
    exposeFunctionsByDefault?:
      | boolean
      | 'unauthenticated'
    rolesHierarchy?: RolesHierarchy
    revalidateToken?: boolean
  }
  tokenUserProperties?: (keyof CollectionItem<'user'>)[]
  errorHandler?: <TError>(
    context: RouteContext,
    error: TError
  )=> unknown | Promise<unknown>
}

export type StaticConfig = {
  outDir?: string
}

