import type { Collection } from '../src'

declare global {
  type Collections = Record<string, Collection>
}
