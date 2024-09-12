import type { Property } from '@aeriajs/types'

export const checkForEmptiness = (property: Property, propName: string, what: Record<string, unknown>) => {
  if( property.readOnly || property.isTimestamp ) {
    return false
  }

  return what[propName] === null
    || what[propName] === undefined
    || what[propName] === ''
}

