import type { Middleware } from '@aeriajs/types'

export const defineCollectionMiddleware = <TMiddleware extends Middleware>(middleware: TMiddleware) => {
  return middleware
}
