import type { Description } from '@aeriajs/types'
import { left, right, isLeft, unwrapEither } from '@aeriajs/common'

const prepareCreate = <TDocument>(doc: TDocument, description: Description) => {
  const result: Record<string, any> = Object.assign({}, description.defaults || {})

  for( const propName in doc ) {
    const value = doc[propName]

    if( value === null || value === undefined ) {
      continue
    }

    result[propName] = value
  }

  return right(result)
}

const prepareUpdate = <TDocument>(doc: TDocument, description: Description) => {
  const result: Record<string, any> = {
    $set: {},
    $unset: {},
  }

  for( const propName in doc ) {
    const value = doc[propName]

    if( propName.startsWith('$') ) {
      if( description.writable  ) {
        return left({})
      }

      result[propName] = value
      continue
    }

    if( value === null || value === undefined ) {
      result.$unset[propName] = value
      continue
    }

    result.$set[propName] = value
  }

  return right(result)
}

export const prepareInsert = <TPayload extends Record<string, any>>(payload: TPayload, description: Description) => {
  const doc = Object.assign({}, payload)
  const docId = payload._id

  delete doc._id
  delete doc.created_at
  delete doc.updated_at

  const whatEither = docId
    ? prepareUpdate(doc, description)
    : prepareCreate(doc, description)

  if( isLeft(whatEither) ) {
    return whatEither
  }

  const what = unwrapEither(whatEither)

  Object.keys(what).forEach((k) => {
    if( typeof what[k] === 'object' && Object.keys(what[k]).length === 0 ) {
      delete what[k]
    }
  })

  return right(what)
}

