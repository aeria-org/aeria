import type { Condition } from '@aeriajs/types'
import { evaluateCondition } from './evaluateCondition.js'

export const isRequired = (propName: string, required: string[] | Record<string, Condition>, subject: unknown) => {
  if( Array.isArray(required) ) {
    return required.includes(propName)
  }

  if( !(propName in required) ) {
    return false
  }

  const requiredProp = required[propName]
  if( typeof requiredProp === 'boolean' ) {
    return requiredProp
  }

  return evaluateCondition(subject, requiredProp as Condition).satisfied
}
