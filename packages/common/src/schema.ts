import type { Property, HTTPStatus } from '@aeriajs/types'

export const errorSchema = <const TObject extends Property>(object: TObject) => {
  return ({
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
  } as const) satisfies Property
}

export const resultSchema = <const TObject extends Property>(object: TObject) => {
  return ({
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
  } as const) satisfies Property
}

export const endpointErrorSchema = <
  const THTTPStatus extends HTTPStatus[],
  const TCode extends string[],
>(error: {
  httpStatus: THTTPStatus,
  code: TCode
}) => {
  return ({
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
  } as const) satisfies Property
}

export const genericEndpointErrorSchema = () => {
  return ({
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
  } as const) satisfies Property
}

