import type { Context, Collection, GetReturnType, GetAllReturnType, CountReturnType, CollectionHookReadPayload } from '@aeriajs/types'
import { iterableMiddlewares } from './iterableMiddlewares.js'

export const applyReadMiddlewares = <TContext extends Context>(
  payload: CollectionHookReadPayload,
  context: Omit<TContext, 'collection'> & {
    collection: Collection
  },
  fn: (p: typeof payload, context: Context)=> Promise<
    | GetReturnType<unknown>
    | GetAllReturnType<unknown>
    | CountReturnType
  >,
) => {
  if( context.collection.middlewares ) {
    if( Array.isArray(context.collection.middlewares) ) {
      const readMiddlewares = context.collection.middlewares.map((middleware) => middleware.beforeRead).filter((fn) => !!fn)
      const start = iterableMiddlewares<typeof payload, ReturnType<typeof fn>>(
        readMiddlewares,
        fn,
      )

      return start(payload, context)
    }

    if( context.collection.middlewares.beforeRead ) {
      return context.collection.middlewares.beforeRead(payload, context, fn)
    }
  }

  return fn(payload, context)
}

