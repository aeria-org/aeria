import type { Description } from '@aeriajs/types'

const freshProperties = (properties: Description['properties']): Record<string, any> => Object.entries(properties).reduce((a, [key, property]) => {
  const value = (() => {
    if( '$ref' in property ) {
      return {}
    }

    if( 'properties' in property ) {
      return freshProperties(property.properties)
    }

    if( 'type' in property ) {
      switch( property.type ) {
        case 'boolean': return false
        case 'array': return []
        case 'object': return {}
      }
    }

    return null
  })()

  if( value === null ) {
    return a
  }

  return {
    ...a,
    [key]: value,
  }
}, {})

export const freshItem = (description: Pick<Description, 'properties' | 'freshItem'>) => {
  const item = freshProperties(description.properties)

  if( description.freshItem ) {
    Object.assign(item, description.freshItem)
  }

  return item
}

