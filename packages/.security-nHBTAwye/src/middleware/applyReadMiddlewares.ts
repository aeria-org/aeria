import type { Context, Collection, GetReturnType, GetAllReturnType, CountReturnType, CollectionReadPayload } from '@aeriajs/types'
import { iterableMiddlewares } from './iterableMiddlewares.js'

export const applyReadMiddlewares = <TContext extends Context>(
  payload: CollectionReadPayload,
  context: TContext,
  fn: (p: typeof payload, context: Context)=> Promise<
    | GetReturnType<unknown>
    | GetAllReturnType<unknown>
    | CountReturnType
  >,
) => {
  const { middlewares }: Collection = context.collection
  if( middlewares ) {
    if( Array.isArray(middlewares) ) {
      const readMiddlewares = middlewares.map((middleware) => middleware.beforeRead).filter((fn) => !!fn)
      const start = iterableMiddlewares<typeof payload, ReturnType<typeof fn>>(
        readMiddlewares,
        fn,
      )

      return start(payload, context)
    }

    if( middlewares.beforeRead ) {
      return middlewares.beforeRead(payload, context, fn)
    }
  }

  return fn(payload, context)
}

