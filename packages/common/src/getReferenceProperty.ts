import type { Property } from '@aeriajs/types'

export const getReferenceProperty = (property: Property) => {
  const search = [
    'items' in property
      ? property.items
      : null,
    'additionalProperties' in property
      ? property.additionalProperties
      : null,
    property,
  ]

  const reference = search.find((_) => !!_)
  return reference && '$ref' in reference
    ? reference
    : null
}
