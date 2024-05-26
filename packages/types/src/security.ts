export type OwnershipMode =
  | boolean
  | 'always'
  | 'on-write'

export enum RateLimitingErrors {
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
