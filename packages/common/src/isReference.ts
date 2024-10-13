import type { Property, RefProperty, ArrayProperty } from '@aeriajs/types'

export const isReference = (property: Property): property is RefProperty | ArrayProperty<RefProperty> => {
  return 'items' in property
    ? '$ref' in property.items
    : '$ref' in property
}

