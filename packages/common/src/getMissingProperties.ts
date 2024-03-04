import type { JsonSchema } from '@aeriajs/types'
import { checkForUndefined } from './checkForUndefined.js'
import { evaluateCondition } from './evaluateCondition.js'

export const getMissingProperties = (
  what: Record<string, any>,
  schema: Omit<JsonSchema, '$id'>,
  required: JsonSchema['required'],
) => {
  const missingProps: string[] = []

  if( Array.isArray(required) ) {
    for( const propName of required ) {
      const isMissing = checkForUndefined(
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
      const requiredProp = required[propName as any]
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

      const isMissing = checkForUndefined(
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

