import type { CollectionMiddleware } from '@aeriajs/types'

export const defineCollectionMiddleware = <TCollectionMiddleware extends CollectionMiddleware<unknown>>(middleware: TCollectionMiddleware) => {
  return middleware
}
