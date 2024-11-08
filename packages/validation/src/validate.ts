import type {
  JsonSchema,
  Property,
  InferSchema,
  Description,
  PropertyValidationError,
  ValidationError,
} from '@aeriajs/types'

import { Result } from '@aeriajs/types'
import { getMissingProperties } from '@aeriajs/common'
import { ValidationErrorCode, PropertyValidationErrorCode } from '@aeriajs/types'

export type ValidateOptions = {
  tolerateExtraneous?: boolean
  throwOnError?: boolean
  coerce?: boolean
  parentProperty?: Omit<Description, '$id'> | Property
}

const getPropertyType = (property: Property) => {
  if( 'type' in property ) {
    if( 'format' in property && property.format ) {
      switch( property.format ) {
        case 'date':
        case 'date-time':
          return 'datetime'
      }
    }

    return property.type
  }

  if( 'enum' in property ) {
    return typeof property.enum[0]
  }

  if( 'const' in property ) {
    return typeof property.const
  }

  if(
    'properties' in property
    || 'additionalProperties' in property
    || '$ref' in property
  ) {
    return 'object'
  }
}

const makePropertyError = <
  TCode extends PropertyValidationErrorCode,
  TDetails extends PropertyValidationError['details'],
>(type: TCode, details?: TDetails) => {
  return ({
    type,
    details,
  } as const) satisfies PropertyValidationError
}

export const makeValidationError = <TValidationError extends ValidationError> (error: TValidationError) => {
  return error
}

export const validateProperty = <TWhat>(
  what: TWhat,
  property: Property | undefined,
  options: ValidateOptions = {},
): Result.Either<PropertyValidationError | ValidationError, unknown> => {
  if( !property ) {
    if( options.parentProperty && 'additionalProperties' in options.parentProperty ) {
      if( options.parentProperty.additionalProperties === true ) {
        return Result.result(what)
      }

      return validateProperty(what, options.parentProperty.additionalProperties)
    }
    if( options.tolerateExtraneous ) {
      return Result.result(undefined)
    }

    return Result.error(makePropertyError(PropertyValidationErrorCode.Extraneous))
  }

  if( what === null || what === undefined ) {
    return Result.result(what)
  }

  if( 'getter' in property ) {
    return Result.result(undefined)
  }

  const expectedType = getPropertyType(property)
  const actualType = Array.isArray(what)
    ? 'array'
    : typeof what

  if(
    actualType !== expectedType
    && !(actualType === 'number' && expectedType === 'integer')
  ) {
    if( expectedType === 'datetime' && what instanceof Date ) {
      return Result.result(what)
    }

    if( '$ref' in property && typeof what === 'string' ) {
      if( /^[0-9a-f]{24}$/.test(what) ) {
        return Result.result(what)
      }
    }

    if( options.coerce ) {
      if( expectedType === 'number' && typeof what === 'string' ) {
        const coerced = parseFloat(what)
        if( !isNaN(coerced) ) {
          return Result.result(coerced)
        }
      }
      if( expectedType === 'integer' && typeof what === 'string' ) {
        const coerced = parseInt(what)
        if( !isNaN(coerced) ) {
          return Result.result(coerced)
        }
      }
      if( expectedType === 'string' && typeof what === 'number' ) {
        return Result.result(String(what))
      }
    }

    return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
      expected: expectedType,
      got: actualType,
    }))
  }

  if( 'type' in property ) {
    switch( property.type ) {
      case 'integer': {
        if( !Number.isInteger(what) ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.NumericConstraint, {
            expected: 'integer',
            got: 'invalid_number',
          }))
        }
      }
      case 'number': {
        if( typeof what !== 'number' ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
            expected: expectedType,
            got: actualType,
          }))
        }

        if(
          (typeof property.maximum === 'number' && property.maximum < what)
        || (typeof property.minimum === 'number' && property.minimum > what)
        || (typeof property.exclusiveMaximum === 'number' && property.exclusiveMaximum <= what)
        || (typeof property.exclusiveMinimum === 'number' && property.exclusiveMinimum >= what)
        ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.NumericConstraint, {
            expected: 'number',
            got: 'invalid_number',
          }))
        }
        break
      }
      case 'object': {
        if( 'properties' in property ) {
          return validate(what, property, options)
        }

        switch( typeof property.additionalProperties ) {
          case 'object': return validate(what, property.additionalProperties, options)
          case 'boolean': return Result.result(what)
        }
      }
      case 'array': {
        if( !Array.isArray(what) ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
            expected: expectedType,
            got: actualType,
          }))
        }

        if( property.minItems ) {
          if( what.length < property.minItems ) {
            return Result.error(makePropertyError(PropertyValidationErrorCode.MoreItemsExpected))
          }
        }

        if( property.maxItems ) {
          if( what.length > property.maxItems ) {
            return Result.error(makePropertyError(PropertyValidationErrorCode.LessItemsExpected))
          }
        }

        let i = 0
        for( const elem of what ) {
          const { error } = validateProperty(elem, property.items, options)
          if( error ) {
            if( 'errors' in error ) {
              continue
            }

            error.index = i
            return Result.error(error)
          }

          i++
        }
      }
    }
  } else if( 'enum' in property ) {
    if( !property.enum.includes(what) && property.enum.length === 0 ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.ExtraneousElement, {
        expected: property.enum,
        got: what,
      }))
    }
  } else if( 'const' in property ) {
    if( what !== property.const ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
        expected: property.const,
        got: what,
      }))
    }
  }

  return Result.result(what)
}

export const validateWholeness = (what: Record<string, unknown>, schema: Omit<JsonSchema, '$id'>) => {
  const required = schema.required
    ? schema.required
    : Object.keys(schema.properties)

  const missingProps = getMissingProperties(what, schema, required)

  if( missingProps.length > 0 ) {
    return makeValidationError({
      code: ValidationErrorCode.MissingProperties,
      errors: Object.fromEntries(missingProps.map((error) => [
        error,
        {
          type: 'missing',
        },
      ])),
    })
  }
}

export const validate = <TWhat, const TJsonSchema extends Omit<Description, '$id'> | Property>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  if( what === undefined ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.EmptyTarget,
      errors: {},
    }))
  }

  if( !('properties' in schema) ) {
    const { error } = validateProperty(what, schema)
    if( error ) {
      return Result.error(error)
    }

    return Result.result(what as InferSchema<TJsonSchema>)
  }

  const wholenessError = validateWholeness(what as Record<string, unknown>, schema)
  if( wholenessError ) {
    if( options.throwOnError ) {
      throw new TypeError(ValidationErrorCode.MissingProperties)
    }
    return Result.error(wholenessError)
  }

  const errors: Record<string, PropertyValidationError | ValidationError> = {}
  const resultCopy: Record<string, unknown> = {}

  for( const propName in what ) {
    const { error, result: parsed } = validateProperty(what[propName], schema.properties[propName], {
      ...options,
      parentProperty: schema,
    })

    if( error ) {
      if( options.throwOnError ) {
        throw new TypeError(ValidationErrorCode.InvalidProperties)
      }
      errors[propName] = error
      continue
    }

    if( parsed !== undefined ) {
      resultCopy[propName] = parsed
    }
  }

  if( Object.keys(errors).length > 0 ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.InvalidProperties,
      errors,
    }))
  }

  return Result.result(resultCopy as InferSchema<TJsonSchema>)
}

export const validator = <const TJsonSchema extends Omit<Description, '$id'> | Property>(
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  return [
    {} as InferSchema<TJsonSchema>,
    <TWhat>(what: TWhat) => {
      return validate(what, schema, options)
    },
  ] as const
}

