import type { JsonSchema, Condition } from '@aeriajs/types'
import { checkForEmptiness } from './checkForEmptiness.js'
import { evaluateCondition } from './evaluateCondition.js'

export const getMissingProperties = (
  what: Record<string, unknown>,
  schema: Omit<JsonSchema, '$id'>,
  required: string[] | Record<string, Condition>,
) => {
  const missingProps: string[] = []

  if( Array.isArray(required) ) {
    for( const propName of required ) {
      const isMissing = checkForEmptiness(
        schema.properties[propName],
        propName,
        what,
      )

      if( isMissing ) {
        missingProps.push(propName)
      }
    }
  } else {
    for( const propName in required ) {
      const requiredProp = required[propName]
      if( typeof requiredProp === 'boolean' ) {
        if( !requiredProp ) {
          continue
        }
      }

      if( typeof requiredProp === 'object' ) {
        const result = evaluateCondition(what, requiredProp)
        if( !result.satisfied ) {
          continue
        }
      }

      const isMissing = checkForEmptiness(
        schema.properties[propName],
        propName,
        what,
      )

      if( isMissing ) {
        missingProps.push(propName)
      }
    }
  }

  return missingProps
}

