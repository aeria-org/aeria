import assert from 'assert'
import { traverseDocument, ObjectId } from '../dist/index.js'
import { PropertyValidationErrorCode, ValidationErrorCode } from '@aeriajs/types'

describe('Traverse document', () => {
  it('returns a validation error on shallow invalid property', async () => {
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

    assert(error)
    assert(typeof error === 'object')
    assert(error.code === ValidationErrorCode.InvalidProperties)
  })

  it('returns a validation error on deep invalid property', async () => {
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

    assert(error)
    assert(typeof error === 'object')
    assert(error.code === ValidationErrorCode.InvalidProperties)
    assert('code' in error.errors.deep)
    assert(error.errors.deep.code === ValidationErrorCode.InvalidProperties)
    assert('type' in error.errors.deep.errors.prop)
    assert(error.errors.deep.errors.prop.type === PropertyValidationErrorCode.Unmatching)
  })

  it('returns a validation error on invalid array element', async () => {
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

    assert(error)
    assert(typeof error === 'object')
    assert(error.code === ValidationErrorCode.InvalidProperties)
    assert('type' in error.errors.array)
    assert(error.errors.array.type === PropertyValidationErrorCode.Unmatching)
    assert(error.errors.array.index === 2)
  })

  it('returns a validation error on invalid array element inside deep property', async () => {
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

    assert(error)
    assert(typeof error === 'object')
    assert(error.code === ValidationErrorCode.InvalidProperties)
    assert('code' in error.errors.deep)
    assert(error.errors.deep.code === ValidationErrorCode.InvalidProperties)
    assert('type' in error.errors.deep.errors.array)
    assert(error.errors.deep.errors.array.type === PropertyValidationErrorCode.Unmatching)
    assert(error.errors.deep.errors.array.index === 2)
  })

  it('autocast deep MongoDB operators', async () => {
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
    assert(result.items.$elemMatch.date instanceof Date)
    assert(result.items.$elemMatch.image instanceof ObjectId)
    assert(result.items.$elemMatch.status === 'accepted')
  })

  it('autocast top-level MongoDB operators', async () => {
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
    assert(result.$and[0].date instanceof Date)
    assert(result.$and[1].image instanceof ObjectId)
    assert(result.$and[2].status === 'accepted')
  })
})
