export enum RateLimitingErrors {
  Unauthenticated = 'UNAUTHENTICATED',
  LimitReached = 'LIMIT_REACHED',
}

export type RateLimitingParams = {
  type:
    | 'tenant'
    | 'ip'
  limit?: number
  scale?: number
  increment?: number
}

export type SecurityPolicy = {
  allowQueryOperators?: string[]
  rateLimiting?: Record<string, RateLimitingParams>
  accessControl?: any
}

