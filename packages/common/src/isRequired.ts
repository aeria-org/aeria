import type { JsonSchema } from '@aeriajs/types'
import { evaluateCondition } from './evaluateCondition.js'

export const isRequired = (propName: string, required: NonNullable<JsonSchema['required']>, subject: unknown) => {
  if( Array.isArray(required) ) {
    return required.includes(propName)
  }

  if( !(propName in required) ) {
    return false
  }

  const requiredProp = required[propName as keyof typeof required]
  if( typeof requiredProp !== 'object' ) {
    return requiredProp
  }

  return evaluateCondition(subject, requiredProp).satisfied
}
