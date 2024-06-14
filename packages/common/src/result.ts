import type { Result } from '@aeriajs/types'

export const isResult = (value: any): value is Result.Either<unknown, unknown> => {
  return value
    && value.constructor === Object
    && (value._tag === 'Error' || value._tag === 'Result')
}

export const throwIfError = <TValue>(either: Result.Either<unknown, TValue>, message?: any) => {
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

