import type { Property } from './property.js'
import type { HTTPStatus } from './http.js'

export const errorSchema = <const TError extends Property>(error: TError) => {
  return ({
    type: 'object',
    properties: {
      _tag: {
        const: 'Error',
      },
      error,
      result: {
        const: undefined,
      },
    },
  } as const) satisfies Property
}

export const resultSchema = <const TResult extends Property>(result: TResult) => {
  return ({
    type: 'object',
    properties: {
      _tag: {
        const: 'Result',
      },
      error: {
        const: undefined,
      },
      result,
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
            unstructured: true,
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
            unstructured: true,
          },
        },
      },
    },
  } as const) satisfies Property
}

