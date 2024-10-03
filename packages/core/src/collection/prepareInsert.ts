import type { Description } from '@aeriajs/types'

export const prepareCreate = (doc: Record<string, unknown>, description: Description) => {
  const result = Object.assign({}, description.defaults || {})

  for( const propName in doc ) {
    const value = doc[propName]
    if( value === null || value === undefined ) {
      continue
    }

    result[propName] = value
  }

  return result
}

export const prepareUpdate = (doc: Record<string, unknown>) => {
  const result: Record<'$set' | '$unset', Record<string, unknown>> = {
    $set: {},
    $unset: {},
  }

  for( const propName in doc ) {
    const value = doc[propName]

    if( value === null || value === undefined ) {
      result.$unset[propName] = value
      continue
    }

    result.$set[propName] = value
  }

  return result
}

