import { expect, test, assert } from 'vitest'
import { PropertyValidationErrorCode, ValidationErrorCode } from '@aeriajs/types'
import { traverseDocument, ObjectId } from '../dist/index.js'

test('returns a validation error on shallow invalid property', async () => {
  const what = {
    prop: 1
  }

  const { error } = await traverseDocument(what, {
    $id: '',
    properties: {
      prop: {
        type: 'string',
      }
    }
  }, {
    validate: true,
  })

  assert(typeof error === 'object')
  expect(error.code).toBe(ValidationErrorCode.InvalidProperties)
})

test('returns a validation error on deep invalid property', async () => {
  const what = {
    deep: {
      prop: 1
    }
  }

  const { error } = await traverseDocument(what, {
    $id: '',
    properties: {
      deep: {
        type: 'object',
        properties: {
          prop: {
            type: 'string',
          }
        }
      }
    }
  }, {
    validate: true,
  })

  assert(typeof error === 'object')
  assert(error.code === ValidationErrorCode.InvalidProperties)
  assert('code' in error.errors.deep)
  assert(error.errors.deep.code === ValidationErrorCode.InvalidProperties)
  assert('type' in error.errors.deep.errors.prop)
  expect(error.errors.deep.errors.prop.type).toBe(PropertyValidationErrorCode.Unmatching)
})

test('returns a validation error on invalid array element', async () => {
  const what = {
    array: [
      '1',
      '2',
      3,
    ]
  }

  const { error } = await traverseDocument(what, {
    $id: '',
    properties: {
      array: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    }
  }, {
    validate: true,
  })

  assert(typeof error === 'object')
  assert(error.code === ValidationErrorCode.InvalidProperties)
  assert('type' in error.errors.array)
  assert(error.errors.array.type === PropertyValidationErrorCode.Unmatching)
  expect(error.errors.array.index).toBe(2)
})

test('returns a validation error on invalid array element inside deep property', async () => {
  const what = {
    deep: {
      array: [
        '1',
        '2',
        3,
      ]
    }
  }

  const { error } = await traverseDocument(what, {
    $id: '',
    properties: {
      deep: {
        type: 'object',
        properties: {
          array: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }
    }
  }, {
    validate: true,
  })

  assert(typeof error === 'object')
  assert(error.code === ValidationErrorCode.InvalidProperties)
  assert('code' in error.errors.deep)
  assert(error.errors.deep.code === ValidationErrorCode.InvalidProperties)
  assert('type' in error.errors.deep.errors.array)
  expect(error.errors.deep.errors.array.type === PropertyValidationErrorCode.Unmatching)
  expect(error.errors.deep.errors.array.index).toBe(2)
})

test('autocast deep MongoDB operators', async () => {
  const what = {
    items: {
      $elemMatch: {
        date: '2023-10-31T21:57:45.943Z',
        image: '653c3d448a707ef3d327f624',
        status: 'accepted',
      },
    },
  }

  const { result } = await traverseDocument(what, {
    $id: '',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date-time',
            },
            image: {
              $ref: 'file',
            },
            status: {
              type: 'string',
            },
          },
        },
      },
    },
  }, {
    autoCast: true,
    allowOperators: true,
  })

  assert(result)
  expect(result.items.$elemMatch.date).toBeInstanceOf(Date)
  expect(result.items.$elemMatch.image).toBeInstanceOf(ObjectId)
  expect(result.items.$elemMatch.status).toBe('accepted')
})

test('autocast top-level MongoDB operators', async () => {
  const what = {
    $and: [
      {
        date: '2023-10-31T21:57:45.943Z',
      },
      {
        image: '653c3d448a707ef3d327f624',
      },
      {
        status: 'accepted',
      },
    ],
  }

  const { result } = await traverseDocument(what, {
    $id: '',
    properties: {
      date: {
        type: 'string',
        format: 'date-time',
      },
      image: {
        $ref: 'file',
      },
      status: {
        type: 'string',
      },
    },
  }, {
    autoCast: true,
    allowOperators: true,
  })

  assert(result)
  expect(result.$and[0].date).toBeInstanceOf(Date)
  expect(result.$and[1].image).toBeInstanceOf(ObjectId)
  expect(result.$and[2].status).toBe('accepted')
})
