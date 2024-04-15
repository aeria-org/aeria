import type { Collection } from '../src/types'

declare global {
  type Collections = Record<string, Collection>
}
