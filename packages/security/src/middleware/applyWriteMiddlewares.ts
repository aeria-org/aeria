import type { Context, Collection, CollectionHookWritePayload, InsertReturnType } from '@aeriajs/types'
import { iterableMiddlewares } from './iterableMiddlewares.js'

export const applyWriteMiddlewares = <TDocument, TContext extends Context>(
  payload: CollectionHookWritePayload,
  context: TContext & {
    collection: Collection
  },
  fn: (p: typeof payload, context: Context)=> Promise<InsertReturnType<TDocument>>,
) => {
  if( context.collection.middlewares ) {
    if( Array.isArray(context.collection.middlewares) ) {
      const writeMiddlewares = context.collection.middlewares.map((middleware) => middleware.beforeWrite).filter((fn) => !!fn)
      const start = iterableMiddlewares<typeof payload, ReturnType<typeof fn>>(
        writeMiddlewares,
        fn,
      )

      return start(payload, context)
    }

    if( context.collection.middlewares.beforeWrite ) {
      return context.collection.middlewares.beforeWrite(payload, context, fn)
    }
  }

  return fn(payload, context)
}

