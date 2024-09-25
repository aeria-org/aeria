import type { Token } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { createContext, insert, ObjectId } from '../../dist/index.js'
import { dbPromise } from './database'

const token: Token = {
  authenticated: false,
  sub: null,
}

export const documents = (async () => {
    const { db } = await dbPromise
    if( !db ) {
      throw new Error
    }

    const projectContext = await createContext({
      collectionName: 'project',
      token,
    })

    const { insertedIds: { "0": file1, "1": file2, } } = await db.collection('file').insertMany([
      {
        name: 'picture1.jpg',
      },
      {
        name: 'picture2.jpg',
      }
    ])

    const { insertedIds: { "0": user1, "1": user2, "2": user3, } } = await db.collection('user').insertMany([
      {
        name: 'john',
        email: 'john@test',
        roles: [],
        picture_file: file1,
      },
      {
        name: 'terry',
        email: 'terry@test',
        roles: [],
        picture_file: file2,
      },
      {
        name: 'dave',
        email: 'dave@test',
        roles: [],
      },
    ])

    const { insertedIds: { "0": person1, "1": person2, "2": person3, } } = await db.collection('person').insertMany([
      {
        name: 'john',
        user: user1,
      },
      {
        name: 'terry',
        user: user2,
      },
      {
        name: 'terry',
        user: user3,
      }
    ])

    const project = throwIfError(await insert({
      what: {
        user_id: user1,
        created_by: person1,
        stakeholders: {
          owner: person1,
          qa: person2
        },
        cronogram: {
          days: [
            {
              date: {
                day: 10,
                month: 7,
                year: 2000,
              },
              assignments: [
                {
                  name: 'assignment 1',
                  status: 'pending',
                  responsibles: [
                    person1,
                    person2,
                    person3,
                    new ObjectId(),
                  ]
                }
              ]
            }
          ]
        }
      }
    }, projectContext))

    return {
      file1,
      file2,
      user1,
      user2,
      person1,
      person2,
      project,
    }
})()

