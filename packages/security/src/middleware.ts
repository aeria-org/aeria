import type { Middleware, MiddlewareNext, GenericMiddlewareNext, Context } from '@aeriajs/types'

export const iterableMiddlewares = function <T, P, TNext extends GenericMiddlewareNext<T, P> = MiddlewareNext>(middlewares: Middleware<T, P, TNext>[]) {
  const [first, ...subsequent] = middlewares
  const it: Generator<GenericMiddlewareNext<T, P>> = function *() {
    for( const middleware of subsequent.concat([(_, initial) => initial]) ) {
      yield (payload: P, initial: T, context: Context) => {
        const { value: next } = it.next()
        return middleware(payload, initial, context, next)
      }
    }
  }()

  return (payload: P, initial: T, context: Context) => {
    const { value: next } = it.next()
    return first(payload, initial, context, next)
  }
}

