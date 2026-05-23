import type { Property } from './property.js'
import type { HTTPStatus } from './http.js'

export const errorSchema = <const TError extends Property>(error: TError) => {
  const schema = {
    type: 'object',
    properties: {
      _tag: {
        const: 'Error',
      },
      error,
      result: {
        const: undefined,
        isConstUndefined: true,
      },
    },
  } as const

  return schema satisfies Property
}

export const resultSchema = <const TResult extends Property>(result: TResult) => {
  const schema = {
    type: 'object',
    properties: {
      _tag: {
        const: 'Result',
      },
      error: {
        const: undefined,
        isConstUndefined: true,
      },
      result,
    },
  } as const

  return schema satisfies Property
}

export const endpointErrorSchema = <
  const THTTPStatus extends typeof HTTPStatus[keyof typeof HTTPStatus][],
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
        isConstUndefined: true,
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
            additionalProperties: true,
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
        isConstUndefined: true,
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
            additionalProperties: true,
          },
        },
      },
    },
  } as const) satisfies Property
}

