import type { Property } from '@aeriajs/types'
import { formatDateTime } from './date.js'
import { getReferenceProperty } from './getReferenceProperty.js'

export const formatValue = (value: any, key: string, property?: Property, index?: string): string => {
  if( Array.isArray(value) ) {
    return value.map((v) => formatValue(v, key, property, index)).join(', ')
  }

  const firstValue = (() => {
    if( !property ) {
      return value
    }

    const refProperty = getReferenceProperty(property)
    if( refProperty ) {
      const firstIndex = index || refProperty.indexes?.[0]
      return firstIndex && value?.[firstIndex]
    }

    if( value instanceof Object ) {
      return Object.values(value)[0]
    }

    return value
  })()

  const formatted = (() => {
    if( !property ) {
      return firstValue
    }

    if( 'type' in property ) {
      if( property.type === 'boolean' ) {
        return firstValue
          ? 'true'
          : false
      }
    }
    if( 'format' in property && property.format ) {
      if( [
        'date',
        'date-time',
      ].includes(property.format) ) {
        return formatDateTime(String(value), {
          hours: property.format === 'date-time',
        })
      }
    }

    if( [
      undefined,
      null,
    ].includes(firstValue) ) {
      return '-'
    }

    return firstValue
  })()

  return String(formatted)
}
