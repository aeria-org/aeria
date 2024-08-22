import type { Condition, TruthyCondition, FinalCondition, RegexCondition } from '@aeriajs/types'
import { getValueFromPath } from './getValueFromPath.js'

const convertExpression = (
  condition:
    | FinalCondition
    | RegexCondition
    | TruthyCondition,
  subject?: unknown,
) => {
  const term2 = 'term2' in condition
    ? condition.fromState
      ? getValueFromPath(subject, condition.term2)
      : condition.term2
    : null

  switch( condition.operator ) {
    case 'truthy': return {
      $ne: [
        null,
        undefined,
      ],
    }

    case 'equal': return term2
    case 'gt': return {
      $gt: term2,
    }
    case 'lt': return {
      $lt: term2,
    }
    case 'gte': return {
      $gte: term2,
    }
    case 'lte': return {
      $lte: term2,
    }
    case 'regex': return {
      $regex: term2,
      $options: condition.regexOptions,
    }

    case 'in': {
      return Array.isArray(term2)
        ? {
          $in: term2,
        }
        : term2
    }
  }
}

export const convertConditionToQuery = (condition: Condition, subject?: Record<string, unknown>): Record<string, unknown> => {
  if( 'or' in condition ) {
    return {
      $or: condition.or.map((sub) => convertConditionToQuery(sub, subject)),
    }
  }

  if( 'and' in condition ) {
    return {
      $and: condition.and.map((sub) => convertConditionToQuery(sub, subject)),
    }
  }

  if( 'not' in condition ) {
    return {
      $not: convertConditionToQuery(condition.not, subject),
    }
  }

  return {
    [condition.term1]: convertExpression(condition, subject),
  }
}

