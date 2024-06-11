import assert from 'assert'
import { traverseDocument, ObjectId } from '../dist'

describe('Traverse document', () => {
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

    const { value } = await traverseDocument(what, {
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

    assert(value)
    assert(value.items.$elemMatch.date instanceof Date)
    assert(value.items.$elemMatch.image instanceof ObjectId)
    assert(value.items.$elemMatch.status === 'accepted')
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

    const { value } = await traverseDocument(what, {
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

    assert(value)
    assert(value.$and[0].date instanceof Date)
    assert(value.$and[1].image instanceof ObjectId)
    assert(value.$and[2].status === 'accepted')
  })
})
