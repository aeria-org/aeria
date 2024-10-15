import type { Middleware, Context } from '@aeriajs/types'

export const iterableMiddlewares = function <TPayload, TReturn>(
  middlewares: Middleware<TPayload, TReturn>[],
  end = (payload: TPayload, _context: Context): any => payload,
) {
  const run = (payload: TPayload, context: Context, index: number): TReturn => {
    if( index === middlewares.length ) {
      return end(payload, context)
    }

    const middleware = middlewares[index]
    return middleware(payload, context, (payload, context) => run(payload, context, index + 1))
  }

  return (payload: TPayload, context: Context) => {
    return run(payload, context, 0) as TReturn
  }
}

