import type { Description, Condition } from '@aeriajs/types'
import { evaluateCondition } from './evaluateCondition.js'

export const isRequired = (propName: string, required: NonNullable<Description['required']>, subject: any) => {
  if( Array.isArray(required) ) {
    return required.includes(propName)
  }

  if( !(propName in required) ) {
    return false
  }

  const requiredProp = required[propName as any]
  if( typeof requiredProp === 'boolean' ) {
    return requiredProp
  }

  return evaluateCondition(subject, requiredProp as Condition).satisfied
}
