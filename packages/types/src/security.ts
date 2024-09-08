import type { Context } from './context.js'
import type { What } from './functions.js'
import type { Result } from './result.js'

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
  propName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type CollectionHookReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
  offset?: number
}

export type CollectionHookWritePayload = {
  what: What<Record<string, any>>
}

export type GenericMiddlewareNext<TPayload, TReturn> = (payload: TPayload, context: Context)=> TReturn
export type MiddlewareNext = <TPayload, TReturn>(payload: TPayload, context: Context)=> TReturn

export type Middleware<TPayload = any, TReturn = any, TReturnNext extends GenericMiddlewareNext<TPayload, TReturn> = GenericMiddlewareNext<TPayload, TReturn>> = (payload: TPayload, context: Context, next: TReturnNext)=> TReturn

export type CollectionMiddleware<TDocument> = {
  beforeRead?: Middleware<CollectionHookReadPayload, Promise<Result.Either<any, TDocument | TDocument[]>>>
  beforeWrite?: Middleware<CollectionHookWritePayload, Promise<Result.Either<any, TDocument>>>
}

