import type { Collection, Description } from '@aeriajs/types'

declare global {
  type Collections = Record<string, Collection>
  type MirrorDescriptions = Record<string, Description>
}
