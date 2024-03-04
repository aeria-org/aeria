import type { Condition } from '@aeriajs/types'
import { arraysIntersects } from './arraysIntersects.js'

const equalOrContains = (term1: any, term2: any) => {
  if( Array.isArray(term1) && Array.isArray(term2) ) {
    return arraysIntersects(term1, term2)
  }

  if( Array.isArray(term1) ) {
    return term1.includes(term2)
  }

  if( Array.isArray(term2) ) {
    return term2.includes(term1)
  }
}

const evaluatesToTrue = (subject: any, condition: Condition): boolean => {
  if( 'term1' in condition ) {
    if( !subject ) {
      return false
    }

    const term1 = subject[condition.term1]
    if( condition.operator === 'truthy' ) {
      return !!term1
    }

    const { operator, term2 } = condition
    switch( operator ) {
      case 'equal': return term1 === term2
      case 'in': return !!equalOrContains(term1, term2)
      case 'gt': return term1 > term2
      case 'lt': return term1 < term2
      case 'gte': return term1 >= term2
      case 'lte': return term1 <= term2
    }
  }

  if( 'and' in condition ) {
    return condition.and.every((condition) => evaluatesToTrue(subject, condition))
  }

  if( 'or' in condition ) {
    return condition.or.some((condition) => evaluatesToTrue(subject, condition))
  }

  if( 'not' in condition ) {
    return !evaluatesToTrue(subject, condition.not)
  }

  return false
}

export const evaluateCondition = (subject: any, condition: Condition) => {
  const result = {
    satisfied: false,
    else: null,
  }

  const satisfied = result.satisfied = evaluatesToTrue(subject, condition)
  if( !satisfied && 'else' in condition ) {
    result.else = condition.else
  }

  return result
}
