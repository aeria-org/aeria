import type { AccessCondition, Token } from '@aeriajs/types'
import { arraysIntersect } from './arraysIntersect.js'

export const isGranted = (condition: AccessCondition, token: Token) => {
  if( Array.isArray(condition) ) {
    return token.authenticated
      ? arraysIntersect(token.roles, condition)
      : condition.includes('unauthenticated')
  }

  switch( condition ) {
    case false: return false
    case true: return token.authenticated
    case 'unauthenticated':
      return true
    case 'unauthenticated-only':
      return !token.authenticated
  }
}

