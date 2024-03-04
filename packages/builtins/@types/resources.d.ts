import type { Collection } from '@aeriajs/types'

declare global {
  type Collections = typeof import('../src/collections')
}
