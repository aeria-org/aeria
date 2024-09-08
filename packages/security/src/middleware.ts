import type { Middleware, MiddlewareNext, GenericMiddlewareNext, Context } from '@aeriajs/types'

export const iterableMiddlewares = function <TPayload, TReturn, TReturnNext extends GenericMiddlewareNext<TPayload, TReturn> = MiddlewareNext>(
  middlewares: Middleware<TPayload, TReturn, TReturnNext>[],
  end = (_: unknown, initial: TReturn) => initial,
) {
  const [first, ...subsequent] = middlewares
  const it: Generator<GenericMiddlewareNext<TPayload, TReturn>> = function *() {
    for( const middleware of subsequent.concat([end]) ) {
      yield (payload: TPayload, initial: TReturn, context: Context) => {
        const { value: next } = it.next()
        return middleware(payload, initial, context, next)
      }
    }
  }()

  return (payload: TPayload, initial: TReturn, context: Context) => {
    const { value: next } = it.next()
    return first(payload, initial, context, next)
  }
}

