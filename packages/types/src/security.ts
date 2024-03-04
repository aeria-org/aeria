export type RateLimitingParams = {
  limit?: number
  scale?: number
  increment?: number
}

export type SecurityPolicy = {
  allowQueryOperators?: string[]
  rateLimiting?: Record<string, RateLimitingParams>
  accessControl?: any
}

