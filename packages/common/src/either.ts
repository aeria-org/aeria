import type { Either, Left, Right } from '@aeriajs/types'

export const left = <const TValue>(value: TValue): Left<TValue> => <const>({
  _tag: 'Left',
  value,
})

export const right = <const TValue>(value: TValue): Right<TValue> => <const>({
  _tag: 'Right',
  value,
})

export const isLeft = <TValue>(either: Either<TValue, any>): either is Left<TValue> => {
  return either._tag === 'Left'
}

export const isRight = <TValue>(either: Either<any, TValue>): either is Right<TValue> => {
  return either._tag === 'Right'
}

export const unwrapEither = <L, R>(either: Either<L, R>) => {
  return either.value
}

export const throwIfLeft = <L, R>(either: Either<L, R>, message?: any) => {
  if( either._tag !== 'Right' ) {
    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(JSON.stringify(either.value, null, 2))
    }

    throw new Error(`throwIfLeft threw: ${either.value} (${message || '-'})`)
  }

  return either.value
}

