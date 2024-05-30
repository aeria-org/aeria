import type { Property, ObjectToSchema, HTTPStatus } from '@aeriajs/types'

const mapValueToProperty = (value: any): any => {
  if( value.constructor === Object ) {
    return Object.assign({
      type: 'object',
    }, fromLiteral(value))
  }

  if( value === Date ) {
    return {
      type: 'string',
      format: 'date-time',
    }
  }

  if( Array.isArray(value) ) {
    return {
      type: 'array',
      items: mapValueToProperty(value[0]),
    }
  }

  if( value && typeof value === 'string' ) {
    return {
      $ref: value,
    }
  }

  return {
    type: typeof value,
  }
}

export const fromLiteral = <
  const TObject,
  TRequired extends (keyof TObject & string)[],
>(object: TObject, required?: TRequired) => {
  const entries: [string, Property][] = []
  for( const propName in object ) {
    const value: any = object[propName]
    if( value === null || value === undefined ) {
      continue
    }

    entries.push([
      propName,
      mapValueToProperty(value),
    ])
  }

  const properties = Object.fromEntries(entries)
  return {
    type: 'object',
    required,
    properties,
  } as ObjectToSchema<TObject, TRequired>
}

export const leftSchema = <const TObject extends Property>(object: TObject) => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Left',
      },
      value: object,
    },
  } satisfies Property
}

export const rightSchema = <const TObject extends Property>(object: TObject) => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Right',
      },
      value: object,
    },
  } satisfies Property
}

export const endpointErrorSchema = <
  THTTPStatus extends HTTPStatus[],
  TCode extends string[],
>(error: {
  httpStatus: THTTPStatus,
  code: TCode
}) => {
  return <const>{
    type: 'object',
    properties: {
      value: {
        type: 'object',
        required: [
          'httpStatus',
          'code',
        ],
        properties: {
          httpStatus: {
            enum: error.httpStatus,
          },
          code: {
            enum: error.code,
          },
          message: {
            type: 'string',
          },
          details: {
            type: 'object',
            variable: true,
          },
        },
      },
    },
  } satisfies Property
}

