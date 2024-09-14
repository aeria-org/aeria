import type { Context, Collection, CollectionWritePayload, InsertReturnType } from '@aeriajs/types'
import { iterableMiddlewares } from './iterableMiddlewares.js'

export const applyWriteMiddlewares = <TDocument, TContext extends Context>(
  payload: CollectionWritePayload,
  context: TContext,
  fn: (p: typeof payload, context: Context)=> Promise<InsertReturnType<TDocument>>,
) => {
  const { middlewares }: Collection = context.collection
  if( middlewares ) {
    if( Array.isArray(middlewares) ) {
      const writeMiddlewares = middlewares.map((middleware) => middleware.beforeWrite).filter((fn) => !!fn)
      const start = iterableMiddlewares<typeof payload, ReturnType<typeof fn>>(
        writeMiddlewares,
        fn,
      )

      return start(payload, context)
    }

    if( middlewares.beforeWrite ) {
      return middlewares.beforeWrite(payload, context, fn)
    }
  }

  return fn(payload, context)
}
