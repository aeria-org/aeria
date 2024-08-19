import type { Property, HTTPStatus } from '@aeriajs/types'

export const errorSchema = <const TObject extends Property>(object: TObject) => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Error',
      },
      error: object,
      result: {
        const: undefined,
      },
    },
  } satisfies Property
}

export const resultSchema = <const TObject extends Property>(object: TObject) => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Result',
      },
      error: {
        const: undefined,
      },
      result: object,
    },
  } satisfies Property
}

export const endpointErrorSchema = <
  const THTTPStatus extends HTTPStatus[],
  const TCode extends string[],
>(error: {
  httpStatus: THTTPStatus,
  code: TCode
}) => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Error',
      },
      result: {
        const: undefined,
      },
      error: {
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

export const genericEndpointErrorSchema = () => {
  return <const>{
    type: 'object',
    properties: {
      _tag: {
        const: 'Error',
      },
      result: {
        const: undefined,
      },
      error: {
        type: 'object',
        required: [
          'httpStatus',
          'code',
        ],
        properties: {
          httpStatus: {
            type: 'number',
          },
          code: {
            type: 'string',
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

