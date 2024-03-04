import type {
  Either,
  JsonSchema,
  Property,
  InferSchema,
  Description,
  PropertyValidationErrorType,
  PropertyValidationError,
  ValidationError,
} from '@aeriajs/types'

import { ObjectId } from '@aeriajs/types'
import { isLeft, left, right, unwrapEither, getMissingProperties } from '@aeriajs/common'
import { ValidationErrorCodes } from '@aeriajs/types'

export type ValidateOptions = {
  extraneous?: string[] | boolean
  throwOnError?: boolean
  coerce?: boolean
}

const getValueType = (value: any) => {
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
  TType extends PropertyValidationErrorType,
  TDetails extends PropertyValidationError['details'],
>(type: TType, details: TDetails) => {
  return {
    type,
    details,
  } satisfies PropertyValidationError
}

export const makeValidationError = <TValidationError extends ValidationError> (error: TValidationError) => {
  return error
}

export const validateProperty = (
  propName: string,
  what: any,
  property: Property | undefined,
  options: ValidateOptions = {},
): Either<PropertyValidationError | ValidationError, any> => {
  const { extraneous, coerce } = options
  if( what === undefined ) {
    return right(what)
  }

  if( !property ) {
    if( extraneous || (Array.isArray(extraneous) && extraneous.includes(propName)) ) {
      return right(what)
    }

    return left(makePropertyError('extraneous', {
      expected: 'undefined',
      got: getValueType(what),
    }))
  }

  if( 'getter' in property ) {
    return right(undefined)
  }

  if( 'properties' in property ) {
    const resultEither = validate(what, property, options)

    return isLeft(resultEither)
      ? resultEither
      : right(what)
  }

  if( 'literal' in property ) {
    if( what !== property.literal ) {
      return left(makePropertyError('unmatching', {
        expected: property.literal ,
        got: what,
      }))
    }

    return right(what)
  }

  const expectedType = getPropertyType(property)!
  const actualType = getValueType(what)

  if( 'enum' in property && property.enum.length === 0 ) {
    return right(what)
  }

  if(
    actualType !== expectedType
    && !('items' in property && actualType === 'array')
    && !(actualType === 'number' && expectedType === 'integer')
  ) {
    if( expectedType === 'datetime' && what instanceof Date ) {
      return right(what)
    }

    if( expectedType === 'boolean' && !what ) {
      return right(what)
    }

    if( '$ref' in property && actualType === 'string' ) {
      if( ObjectId.isValid(what) ) {
        return right(what)
      }
    }

    if( coerce ) {
      if( expectedType === 'number' && actualType === 'string' ) {
        const coerced = parseFloat(what)
        if( !isNaN(coerced) ) {
          return right(coerced)
        }
      }
      if( expectedType === 'integer' && actualType === 'string' ) {
        const coerced = parseInt(what)
        if( !isNaN(coerced) ) {
          return right(coerced)
        }
      }
      if( expectedType === 'string' && actualType === 'number' ) {
        return right(String(what))
      }

    }

    return left(makePropertyError('unmatching', {
      expected: expectedType,
      got: actualType,
    }))
  }

  if( 'items' in property ) {
    let i = 0
    for( const elem of what ) {
      const resultEither = validateProperty(propName, elem, property.items, options)

      if( isLeft(resultEither) ) {
        const result = unwrapEither(resultEither)
        if( 'errors' in result ) {
          continue
        }

        result.index = i
        return left(result)
      }

      i++
    }
  } else if( 'type' in property ) {
    if( property.type === 'integer' ) {
      if( !Number.isInteger(what) ) {
        return left(makePropertyError('numeric_constraint', {
          expected: 'integer',
          got: 'invalid_number',
        }))
      }
    }

    if( property.type === 'integer' || property.type === 'number' ) {
      if(
        (property.maximum && property.maximum < what)
      || (property.minimum && property.minimum > what)
      || (property.exclusiveMaximum && property.exclusiveMaximum <= what)
      || (property.exclusiveMinimum && property.exclusiveMinimum >= what)
      ) {
        return left(makePropertyError('numeric_constraint', {
          expected: 'number',
          got: 'invalid_number',
        }))
      }
    }
  } else if( 'enum' in property ) {
    if( !property.enum.includes(what) ) {
      return left(makePropertyError('extraneous_element', {
        expected: property.enum,
        got: what,
      }))
    }
  }

  return right(what)
}

export const validateWholeness = (what: Record<string, any>, schema: Omit<JsonSchema, '$id'>) => {
  const required = schema.required
    ? schema.required
    : Object.keys(schema.properties)

  const missingProps = getMissingProperties(what, schema, required)

  if( missingProps.length > 0 ) {
    return makeValidationError({
      code: ValidationErrorCodes.MissingProperties,
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
    return left(makeValidationError({
      code: ValidationErrorCodes.EmptyTarget,
      errors: {},
    }))
  }

  if( !('properties' in schema) ) {
    const resultEither = validateProperty('', what, schema)
    return isLeft(resultEither)
      ? resultEither
      : right(what as InferSchema<TJsonSchema>)
  }

  const wholenessError = validateWholeness(what, schema)
  if( wholenessError ) {
    return left(wholenessError)
  }

  const errors: Record<string, PropertyValidationError | ValidationError> = {}
  const resultCopy: Record<string, any> = {}

  for( const propName in what ) {
    const resultEither = validateProperty(
      propName,
      what[propName],
      schema.properties[propName],
      options,
    )

    if( isLeft(resultEither) ) {
      const result = unwrapEither(resultEither)
      errors[propName] = result
    }

    resultCopy[propName] = unwrapEither(resultEither)
  }

  if( Object.keys(errors).length > 0 ) {
    if( options.throwOnError ) {
      const error = new TypeError(ValidationErrorCodes.InvalidProperties)
      Object.assign(error, {
        errors,
      })
      throw error
    }

    return left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors,
    }))
  }

  return right(resultCopy as InferSchema<TJsonSchema>)
}

export const validateSilently = <
  TWhat,
  const TJsonSchema extends Omit<Description, '$id'> | Property,
>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  const resultEither = validate(what, schema, options)
  return isLeft(resultEither)
    ? null
    : unwrapEither(resultEither)
}

export const validator = <const TJsonSchema extends Omit<Description, '$id'> | Property>(
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {

  return <const>[
    {} as InferSchema<TJsonSchema>,
    <TWhat extends Record<string, any>>(what: TWhat) => {
      return validate(what, schema, options)
    },
  ]
}

export const silentValidator = <const TJsonSchema extends Omit<Description, '$id'> | Property>(
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {

  return <const>[
    {} as InferSchema<TJsonSchema>,
    <TWhat extends Record<string, any>>(what: TWhat) => {
      return validateSilently(what, schema, options)
    },
  ]
}

