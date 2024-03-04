import type { Property } from '@aeriajs/types'

export const checkForUndefined = (property: Property, propertyName: string, what: Record<string, any>) => {
  if( property.readOnly || property.isTimestamp ) {
    return false
  }

  return what[propertyName] === null
    || what[propertyName] === undefined
    || what[propertyName] === ''
}

