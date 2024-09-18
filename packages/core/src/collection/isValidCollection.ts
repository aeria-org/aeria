import type { Description, Collection } from '@aeriajs/types'

export const isValidDescription = (value: unknown): value is Description => {
  return !!(
    value
    && typeof value === 'object'
    && '$id' in value
    && 'properties' in value
    && value.properties
    && typeof value.$id === 'string'
    && typeof value.properties === 'object'
  )
}

export const isValidCollection = (value: unknown): value is Collection => {
  return !!(
    value
    && typeof value === 'object'
    && 'description' in value
    && isValidDescription(value.description)
  )
}

