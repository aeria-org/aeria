import type { Description, Property, InferProperty } from '@aeriajs/types'

export const freshProperty = <const TProperty extends Property>(property: TProperty) => {
  const value = (() => {
    if( '$ref' in property && property.inline ) {
      return {}
    }

    if( 'properties' in property ) {
      const obj: Record<string, unknown> = {}
      for( const propName in property.properties ) {
        obj[propName] = freshProperty(property.properties[propName])
      }
      return obj
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

  return value as InferProperty<TProperty>
}

export const freshItem = (description: Pick<Description, 'properties' | 'freshItem'>) => {
  const item: Record<string, unknown> = {}
  for( const propName in description.properties ) {
    item[propName] = freshProperty(description.properties[propName])
  }

  if( description.freshItem ) {
    Object.assign(item, description.freshItem)
  }

  return item
}

