import type { Middleware, MiddlewareNext, GenericMiddlewareNext, Context } from '@aeriajs/types'

export const iterableMiddlewares = function <TPayload, TReturn, TReturnNext extends GenericMiddlewareNext<TPayload, TReturn> = MiddlewareNext>(
  middlewares: Middleware<TPayload, TReturn, TReturnNext>[],
  end = (payload: any, _context: Context) => payload,
) {
  const [first, ...subsequent] = middlewares
  const it: Generator<GenericMiddlewareNext<TPayload, TReturn>> = function *() {
    for( const middleware of subsequent.concat([end]) ) {
      yield (payload: TPayload, context: Context) => {
        const { value: next } = it.next()
        return middleware(Object.assign({}, payload), context, next)
      }
    }
  }()

  return (payload: TPayload, context: Context) => {
    const { value: next } = it.next()
    return first(Object.assign({}, payload), context, next)
  }
}

