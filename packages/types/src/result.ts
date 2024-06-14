export namespace Result {
  export type Error<T> = {
    readonly _tag: 'Error'
    readonly error: T
    readonly result: undefined
  }

  export type Result<T> = {
    readonly _tag: 'Result'
    readonly error: undefined
    readonly result: T
  }

  export type Either<E, R> = Result.Error<E> | Result.Result<R>

  export const error = <const TValue>(value: TValue) => <const>({
    _tag: 'Error',
    error: value,
    result: undefined,
  })

  export const result = <const TValue>(value: TValue) => <const>({
    _tag: 'Result',
    error: undefined,
    result: value,
  })
}

export type ExtractError<T> = T extends Result.Error<infer L>
  ? L
  : never

export type ExtractResult<T> = T extends Result.Result<infer R>
  ? R
  : never

