export declare namespace Result {
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

  export type Either<L, R> = Result.Error<L> | Result.Result<R>
}

export type ExtractError<T> = T extends Result.Error<infer L>
  ? L
  : never

export type ExtractResult<T> = T extends Result.Result<infer R>
  ? R
  : never

