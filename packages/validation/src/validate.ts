import type { JsonSchema, Property, InferSchema, Description, PropertyValidationError, ValidationError, CollectionModel } from '@aeriajs/types'
import type { ObjectId } from 'mongodb'
import { convertConditionToQuery, getMissingProperties } from '@aeriajs/common'
import { Result, ValidationErrorCode, PropertyValidationErrorCode } from '@aeriajs/types'
import { getCollection } from '@aeriajs/entrypoint'

export type ValidateOptions = {
  tolerateExtraneous?: boolean
  checkObjectIds?: boolean
  throwOnError?: boolean
  coerce?: boolean
  coerceObjectIds?: boolean
  parentProperty?: Property | Description
  descriptions?: Record<string, Description>
  objectIdConstructor?: new(arg: unknown) => ObjectId
  context?: {
    collections: Record<string, {
      model: CollectionModel<Description>
    }>
  }
}

const isValidObjectId = (what: string) => {
  return /^[0-9a-f]{24}$/.test(what)
}

const getPropertyType = (property: Property) => {
  if( 'type' in property ) {
    if( 'format' in property && property.format ) {
      switch( property.format ) {
        case 'date':
        case 'date-time':
          return 'datetime'
        case 'objectid':
          return 'object'
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
  TCode extends typeof PropertyValidationErrorCode[keyof typeof PropertyValidationErrorCode],
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

    if( '$ref' in property ) {
      switch( typeof what ) {
        case 'string': {
          if( isValidObjectId(what) ) {
            return Result.result(what)
          }
          return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
            expected: expectedType,
            got: actualType,
          }))
        }
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
      if( expectedType === 'datetime' && typeof what === 'string' ) {
        return Result.result(new Date(what))
      }
    }

    if( (options.coerce || options.coerceObjectIds) && options.objectIdConstructor ) {
      if( ('$ref' in property || 'format' in property && property.format === 'objectid') && typeof what === 'string' ) {
        return Result.result(new options.objectIdConstructor(what))
      }
    }

    return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
      expected: expectedType,
      got: actualType,
    }))
  }

  if( 'type' in property ) {
    switch( property.type ) {
      case 'string': {
        if( typeof what !== 'string' ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
            expected: expectedType,
            got: actualType,
          }))
        }

        if(
          (property.format === 'objectid' && !isValidObjectId(what))
          || (typeof property.minLength === 'number' && property.minLength > what.length)
          || (typeof property.maxLength === 'number' && property.maxLength < what.length)
        ) {
          return Result.error(makePropertyError(PropertyValidationErrorCode.StringConstraint, {
            expected: 'string',
            got: 'invalid_string',
          }))
        }
        break
      }
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
            if( 'code' in error ) {
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
    if( !property.enum.includes(what) ) {
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

export const validateRefs = async <TWhat>(
  what: TWhat,
  property: Property | Description,
  options: ValidateOptions = {},
): Promise<Result.Either<PropertyValidationError | ValidationError, unknown>> => {
  if( '$ref' in property ) {
    if( options.checkObjectIds ) {
      if( !options.context || !options.objectIdConstructor ) {
        throw new Error
      }

      if( what === null ) {
        return Result.result({})
      }

      if( !isValidObjectId(String(what)) ) {
        return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
          expected: 'objectid',
          got: typeof what,
        }))
      }

      let query: Record<string, unknown>
      if( property.constraints ) {
        query = {
          $and: [
            {
              _id: new options.objectIdConstructor(what),
            },
            convertConditionToQuery(property.constraints),
          ],
        }
      } else {
        query = {
          _id: new options.objectIdConstructor(what),
        }
      }

      const exists = await options.context.collections[property.$ref].model.findOne(query, {
        projection: {
          _id: 1,
        },
      })

      if( !exists ) {
        return Result.error(makePropertyError(PropertyValidationErrorCode.ReferenceConstraint, {
          expected: 'objectid',
          got: 'invalid_objectid',
        }))
      }

      return Result.result({})
    }

    let description: Description
    if( options.descriptions ) {
      description = options.descriptions[property.$ref]
    } else {
      const collection = await getCollection(property.$ref)
      if( !collection ) {
        throw new Error
      }

      description = collection.description
    }

    if( typeof what !== 'object' ) {
      return Result.error(makePropertyError(PropertyValidationErrorCode.Unmatching, {
        expected: 'object',
        got: typeof what,
      }))
    }

    return validate(what, description, options)
  } else if( 'items' in property ) {
    if( !Array.isArray(what) ) {
      throw new Error
    }
    for( const elem of what ) {
      const { error } = await validateRefs(elem, property.items, options)
      if( error ) {
        return Result.error(error)
      }
    }
  } else if( 'properties' in property ) {
    const details: Record<string, PropertyValidationError | ValidationError> = {}
    for( const propName in what ) {
      const { error } = await validateRefs(what[propName], property.properties[propName], options)
      if( error ) {
        details[propName] = error
      }
    }

    if( Object.keys(details).length > 0 ) {
      return Result.error(makeValidationError({
        code: ValidationErrorCode.InvalidProperties,
        details,
      }))
    }
  }

  return Result.result({})
}

export const validateWholeness = (what: Record<string, unknown>, schema: Omit<JsonSchema, '$id'>) => {
  const required = schema.required
    ? schema.required
    : Object.keys(schema.properties)

  const missingProps = getMissingProperties(what, schema, required)

  if( missingProps.length > 0 ) {
    return makeValidationError({
      code: ValidationErrorCode.MissingProperties,
      details: Object.fromEntries(missingProps.map((error) => [
        error,
        {
          type: 'missing',
        },
      ])),
    })
  }
}

export const validate = <TWhat, const TJsonSchema extends Property | Description>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  if( what === undefined ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.EmptyTarget,
      details: {},
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

  const details: Record<string, PropertyValidationError | ValidationError> = {}
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
      details[propName] = error
      continue
    }

    if( parsed !== undefined ) {
      resultCopy[propName] = parsed
    }
  }

  if( Object.keys(details).length > 0 ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.InvalidProperties,
      details,
    }))
  }

  return Result.result(resultCopy as InferSchema<TJsonSchema>)
}

export const validateWithRefs = async <TWhat, const TJsonSchema extends Property | Description>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {},
) => {
  const { error: refsError } = await validateRefs(what, schema, options)
  if( refsError ) {
    return Result.error(refsError)
  }

  return validate(what, schema, options)
}

export const validatePropertyWithRefs = async <TWhat>(
  what: TWhat | undefined,
  property: Property,
  options: ValidateOptions = {},
) => {
  const { error: refsError } = await validateRefs(what, property, options)
  if( refsError ) {
    return Result.error(refsError)
  }

  return validateProperty(what, property, options)
}

export const validator = <const TJsonSchema extends Property | Description>(
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

