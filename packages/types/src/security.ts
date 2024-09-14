import type { Context } from './context.js'
import type { What } from './functions.js'
import type { Result } from './result.js'
import type { QuerySort } from './functions.js'

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

export type CollectionProps<TPayload> = {
  propName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type CollectionReadPayload = {
  filters: Record<string, unknown> | unknown[]
  sort?: QuerySort<unknown>
  limit?: number
  offset?: number
}

export type CollectionWritePayload = {
  what: What<Record<string, unknown>>
}

export type GenericMiddlewareNext<TPayload, TReturn> = (payload: TPayload, context: Context)=> TReturn
export type MiddlewareNext = <TPayload, TReturn>(payload: TPayload, context: Context)=> TReturn

export type Middleware<TPayload = unknown, TReturn = unknown, TReturnNext extends GenericMiddlewareNext<TPayload, TReturn> = GenericMiddlewareNext<TPayload, TReturn>> = (payload: TPayload, context: Context, next: TReturnNext)=> TReturn

export type CollectionMiddleware<TDocument> = {
  beforeRead?: Middleware<CollectionReadPayload, Promise<Result.Either<any, TDocument | TDocument[]>>>
  beforeWrite?: Middleware<CollectionWritePayload, Promise<Result.Either<any, TDocument>>>
}

