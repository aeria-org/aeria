import type { Condition } from '@aeriajs/types'
import { arraysIntersect } from './arraysIntersect.js'

const isCondition = (subject: unknown): subject is Condition => {
  if( !subject || typeof subject !== 'object' ) {
    return false
  }

  return (
    'and' in subject
    || 'or' in subject
    || 'not' in subject
    || ('operator' in subject && 'term1' in subject)
  )
}

const equalOrContains = (term1: unknown, term2: unknown) => {
  if( Array.isArray(term1) && Array.isArray(term2) ) {
    return arraysIntersect(term1, term2)
  }

  if( Array.isArray(term1) ) {
    return term1.includes(term2)
  }

  if( Array.isArray(term2) ) {
    return term2.includes(term1)
  }
}

const evaluateExpression = (subject: unknown, expression: unknown): unknown => {
  if( !isCondition(expression) ) {
    return expression
  }

  if( 'term1' in expression ) {
    if( !subject || typeof subject !== 'object' ) {
      return false
    }

    const term1 = subject[expression.term1 as keyof typeof subject]
    if( expression.operator === 'truthy' ) {
      return !!term1
    }

    const { operator, term2 } = expression
    const right = evaluateExpression(subject, term2)

    switch( operator ) {
      case 'equal': return term1 === right
      case 'in': return !!equalOrContains(term1, right)
      case 'gt': return term1 > Number(right)
      case 'lt': return term1 < Number(right)
      case 'gte': return term1 >= Number(right)
      case 'lte': return term1 <= Number(right)
      case 'regex': return new RegExp(right as string).test(term1)
    }
  }

  if( 'and' in expression ) {
    return expression.and.every((expression) => evaluateExpression(subject, expression))
  }

  if( 'or' in expression ) {
    return expression.or.some((expression) => evaluateExpression(subject, expression))
  }

  if( 'not' in expression ) {
    return !evaluateExpression(subject, expression.not)
  }

  return false
}

export const evaluateCondition = (subject: unknown, condition: Condition) => {
  const result = {
    satisfied: false,
    else: null as unknown,
  }

  const satisfied = result.satisfied = !!evaluateExpression(subject, condition)
  if( !satisfied && 'else' in condition ) {
    result.else = condition.else
  }

  return result
}

