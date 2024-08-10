import type { Context } from './context.js'

export type OwnershipMode =
  | boolean
  | 'always'
  | 'on-write'

export enum RateLimitingError {
  Unauthenticated = 'UNAUTHENTICATED',
  LimitReached = 'LIMIT_REACHED',
}

export type DiscriminationStrategy =
  | 'tenant'
  | 'ip'

export type RateLimitingWithScale = {
  scale: number
}

export type RateLimitingWithLimit = {
  limit: number
}

export type RateLimitingParams = {
  strategy: DiscriminationStrategy
  increment?: number
} & (
  | RateLimitingWithLimit
  | RateLimitingWithScale
  | (RateLimitingWithLimit & RateLimitingWithScale)
)

export type LoggingLevel =
  | 'debug'
  | 'info'
  | 'error'
  | 'critical'

export type LoggingParams = {
  strategy: DiscriminationStrategy
  level: LoggingLevel
}

export type SecurityPolicy = {
  allowQueryOperators?: string[]
  rateLimiting?: RateLimitingParams
  logging?: LoggingParams
}

export type CollectionSecurityPolicy<
  TCollection extends {
    functions?: Record<string, unknown>
  },
> = {
  functions?: Partial<
    Record<
      keyof TCollection['functions'],
      SecurityPolicy
    >
  >
}

export type CollectionHookProps<TPayload = any> = {
  propertyName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type GenericMiddlewareNext<T, P> = (payload: P, initial: T, context: Context)=> T | Promise<T>
export type MiddlewareNext = <T, P>(payload: P, initial: T, context: Context)=> T | Promise<T>

export type Middleware<T = any, P = any, TNext extends GenericMiddlewareNext<T, P> = GenericMiddlewareNext<T, P>> = (payload: P, initial: T, context: Context, next: TNext)=> T | Promise<T>

export type CollectionMiddleware = {
  beforeRead: Middleware
  beforeWrite: Middleware
}

