import type { Result as R } from '@aeriajs/types/result'

export namespace Result {
  export type Error<T> = R.Error<T>
  export type Result<T> = R.Result<T>
  export type Either<TLeft, TRight> = R.Either<TLeft, TRight>

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

export const throwIfError = <TValue>(either: R.Either<unknown, TValue>, message?: any) => {
  if( !either.result ) {
    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(JSON.stringify(either.error, null, 2))
    }

    throw new Error(`throwIfError threw: ${either.error} ${message
      ? `(${message})`
      : ''}`)
  }

  return either.result
}

