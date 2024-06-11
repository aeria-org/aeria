export type Left<T> = {
  readonly _tag: 'Left'
  readonly error: T
  readonly value: undefined
}

export type Right<T> = {
  readonly _tag: 'Right'
  readonly error: undefined
  readonly value: T
}

export type ExtractLeft<T> = T extends Left<infer L>
  ? L
  : never

export type ExtractRight<T> = T extends Right<infer R>
  ? R
  : never

export type Either<L, R> = Left<L> | Right<R>

