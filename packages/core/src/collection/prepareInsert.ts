import type { Description } from '@aeriajs/types'

const prepareCreate = <TDocument>(doc: TDocument, description: Description) => {
  const result = Object.assign({}, description.defaults || {})

  for( const propName in doc ) {
    const value = doc[propName]
    if( value === undefined ) {
      continue
    }

    result[propName] = value
  }

  return result
}

const prepareUpdate = <TDocument>(doc: TDocument) => {
  const result: Record<string, Record<string, unknown>> = {
    $set: {},
    $unset: {},
  }

  for( const propName in doc ) {
    const value = doc[propName]

    if( value === undefined ) {
      result.$unset[propName] = value
      continue
    }

    result.$set[propName] = value
  }

  return result
}

export const prepareInsert = <TPayload extends Record<string, unknown>>(payload: TPayload, description: Description) => {
  const { _id: docId, ...doc } = Object.assign({}, payload)

  return docId
    ? prepareUpdate(doc)
    : prepareCreate(doc, description)
}

