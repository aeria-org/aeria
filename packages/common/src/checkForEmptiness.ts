import type { Property } from '@aeriajs/types'

export const checkForEmptiness = (what: Record<string, unknown>, property: Property, propName: string) => {
  if( property.readOnly || property.isTimestamp ) {
    return false
  }

  return what[propName] === null
    || what[propName] === undefined
    || what[propName] === ''
}

