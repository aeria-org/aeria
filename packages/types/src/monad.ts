export type Left<T> = {
  readonly _tag: 'Left'
  readonly value: T
}

export type Right<T> = {
  readonly _tag: 'Right'
  readonly value: T
}

export type EndpointErrorContent = {
  httpCode?: number
  code: string
  message: string
  details?: Record<string, any>
}

export type EndpointError<T extends EndpointErrorContent> = {
  readonly _tag: 'Error'
  readonly error: T
}

export type ExtractLeft<T> = T extends Left<infer L>
  ? L
  : never

export type ExtractRight<T> = T extends Right<infer R>
  ? R
  : never

export type Either<L, R> = Left<L> | Right<R>

