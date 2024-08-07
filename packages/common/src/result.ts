import type { Result } from '@aeriajs/types'

export const isResult = (value: any): value is Result.Either<unknown, unknown> => {
  return value
    && value.constructor === Object
    && (value._tag === 'Error' || value._tag === 'Result')
}

export const isError = (object: any): object is Result.Error<unknown> => {
  return object
    && object._tag === 'Error'
    && 'error' in object
}

export const throwIfError = <TValue>(either: Result.Either<unknown, TValue>, message?: any) => {
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

