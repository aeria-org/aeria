import type { Property, ObjectToSchema, EndpointErrorContent } from '@aeriajs/types'

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

export const endpointErrorSchema = (error: EndpointErrorContent) => {
  if( error.message ) {
    return <const>{
      type: 'object',
      properties: {
        httpCode: {
          const: error.code,
        },
        code: {
          const: error.code,
        },
        message: {
          const: error.message,
        },
      },
    } satisfies Property
  }

  return <const>{
    type: 'object',
    properties: {
      httpCode: {
        const: error.code,
      },
      code: {
        const: error.code,
      },
    },
  } satisfies Property
}

