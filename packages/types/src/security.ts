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

export type GenericMiddlewareNext<TReturn, TPayload> = (payload: TPayload, initial: TReturn, context: Context)=> TReturn | Promise<TReturn>
export type MiddlewareNext = <TReturn, TReturnPayload>(payload: TReturnPayload, initial: TReturn, context: Context)=> TReturn | Promise<TReturn>

export type Middleware<TReturn = any, TPayload = any, TReturnNext extends GenericMiddlewareNext<TReturn, TPayload> = GenericMiddlewareNext<TReturn, TPayload>> = (payload: TPayload, initial: TReturn, context: Context, next: TReturnNext)=> TReturn | Promise<TReturn>

export type CollectionMiddleware = {
  beforeRead: Middleware
  beforeWrite: Middleware
}

