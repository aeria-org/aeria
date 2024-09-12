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
  filterOutExtraneous?: boolean
  throwOnError?: boolean
  coerce?: boolean
  parentProperty?: Omit<Description, '$id'> | Property
}

const getValueType = (value: unknown) => {
  return Array.isArray(value)
    ? 'array'
    : typeof value
}

const getPropertyType = (property: Property) => {
  if(
    '$ref' in property
    || 'properties' in property
    || 'additionalProperties' in property
  ) {
    return 'object'
  }

  if( 'enum' in property ) {
    return typeof property.enum[0]
  }

  if( 'format' in property && property.format ) {
    if ([
      'date',
      'date-time',
    ].includes(property.format)) {
      return 'datetime'
    }
  }

  if( 'type' in property ) {
    return property.type
  }
}

const makePropertyError = <
  TCode extends PropertyValidationErrorCode,
  TDetails extends PropertyValidationError['details'],
>(type: TCode, details: TDetails) => {
  return <const>{
    type,
    details,
  } satisfies PropertyValidationError
}

export const makeValidationError = <TValidationError extends ValidationError> (error: TValidationError) => {
  return error
}

export const validateProperty = <TWhat>(
  propName: string,
  what: TWhat,
  property: Property | undefined,
  options: ValidateOptions = {},
): Result.Either<PropertyValidationError | ValidationError, unknown> => {
  const { filterOutExtraneous, coerce } = options
  if( what === null || what === undefined ) {
    return Result.result(what)
  }

  if( !property ) {
    if( options.parentProperty && 'additionalProperties' in options.parentProperty && options.parentProperty.additionalProperties ) {
      const extraneous = options.parentProperty.additionalProperties
      if( typeof extraneous === 'boolean' || Object.keys(extraneous).includes(propName) ) {
        if( filterOutExtraneous ) {
          return Result.result(undefined)
        }

        return Result.result(what)
      }

      return Result.result(what)
    }

    return Result.error(makePropertyError(PropertyValidationErrorCode.Extraneous, {
      expected: 'undefined',
      got: getValueType(what),
    }))
  }

  if( 'getter' in property ) {
    return Result.result(undefined)
  }

  if( 'properties' in property ) {
    return validate(what, property, options)
  }

  if( 'const' in property ) {
    if( what !== property.const ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
        expected: property.const,
        got: what,
      }))
    }

    return Result.result(what)
  }

  const expectedType = getPropertyType(property)!
  const actualType = getValueType(what)

  if( 'enum' in property && property.enum.length === 0 ) {
    return Result.result(what)
  }

  if(
    actualType !== expectedType
    && !('items' in property && actualType === 'array')
    && !(actualType === 'number' && expectedType === 'integer')
  ) {
    if( expectedType === 'datetime' && what instanceof Date ) {
      return Result.result(what)
    }

    if( '$ref' in property && typeof what === 'string' ) {
      if( /^[0-9a-fA-F]{24}$/.test(what) ) {
        return Result.result(what)
      }
    }

    if( coerce ) {
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

  if( 'items' in property ) {
    if( !Array.isArray(what) ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
        expected: expectedType,
        got: actualType,
      }))
    }

    let i = 0
    for( const elem of what ) {
      const { error } = validateProperty(propName, elem, property.items, options)

      if( error ) {
        if( 'errors' in error ) {
          continue
        }

        error.index = i
        return Result.error(error)
      }

      i++
    }
  } else if( 'type' in property ) {
    if( property.type === 'integer' ) {
      if( !Number.isInteger(what) ) {
        return Result.error(makePropertyError(PropertyValidationErrorCode.NumericConstraint, {
          expected: 'integer',
          got: 'invalid_number',
        }))
      }
    }

    if( property.type === 'integer' || property.type === 'number' ) {
      if( typeof what !== 'number' ) {
        return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
          expected: expectedType,
          got: actualType,
        }))
      }

      if(
        (property.maximum && property.maximum < what)
      || (property.minimum && property.minimum > what)
      || (property.exclusiveMaximum && property.exclusiveMaximum <= what)
      || (property.exclusiveMinimum && property.exclusiveMinimum >= what)
      ) {
        return Result.error(makePropertyError(PropertyValidationErrorCode.NumericConstraint, {
          expected: 'number',
          got: 'invalid_number',
        }))
      }
    }
  } else if( 'enum' in property ) {
    if( !property.enum.includes(what) ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.ExtraneousElement, {
        expected: property.enum,
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
      errors: Object.fromEntries(missingProps
        .map((error) => [
          error,
          {
            type: 'missing',
          },
        ])),
    })
  }

}

export const validate = <
  TWhat,
  const TJsonSchema extends Omit<Description, '$id'> | Property,
>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  if( !what ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.EmptyTarget,
      errors: {},
    }))
  }

  if( !('properties' in schema) ) {
    const { error } = validateProperty('', what, schema)
    return error
      ? Result.error(error)
      : Result.result(what as InferSchema<TJsonSchema>)
  }

  const wholenessError = validateWholeness(what, schema)
  if( wholenessError ) {
    return Result.error(wholenessError)
  }

  const errors: Record<string, PropertyValidationError | ValidationError> = {}
  const resultCopy: Record<string, unknown> = {}

  for( const propName in what ) {
    const { error, result: parsed } = validateProperty(
      propName,
      what[propName],
      schema.properties[propName],
      {
        ...options,
        parentProperty: schema,
      },
    )

    if( error ) {
      errors[propName] = error
    }

    if( parsed !== undefined ) {
      resultCopy[propName] = parsed
    }
  }

  if( Object.keys(errors).length > 0 ) {
    if( options.throwOnError ) {
      const error = new TypeError(ValidationErrorCode.InvalidProperties)
      Object.assign(error, {
        errors,
      })
      throw error
    }

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

  return <const>[
    {} as InferSchema<TJsonSchema>,
    <TWhat>(what: TWhat) => {
      return validate(what, schema, options)
    },
  ]
}

