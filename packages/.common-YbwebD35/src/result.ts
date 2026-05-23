import type { Result } from '@aeriajs/types'

export const isEither = (value: unknown): value is Result.Either<unknown, unknown> => {
  return !!(value
    && typeof value === 'object'
    && '_tag' in value
    && (value._tag === 'Error' || value._tag === 'Result'))
}

export const isResult = (value: unknown): value is Result.Result<unknown> => {
  return !!(isEither(value) && value.result)
}

export const isError = (value: unknown): value is Result.Error<unknown> => {
  return !!(isEither(value) && value.error)
}

export const throwIfError = <TValue>(either: Result.Either<unknown, TValue>, message?: unknown) => {
  if( either.error ) {
    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(JSON.stringify(either.error, null, 2))
    }

    throw new Error(`throwIfError threw: ${either.error} ${message
      ? `(${message})`
      : ''}`)
  }

  return either.result!
}

