import type { PackReferences, Token } from '@aeriajs/types'
import type { User, File } from '@aeriajs/builtins'
import { throwIfError } from '@aeriajs/common'
import { createContext, insert, ObjectId } from '../../dist/index.js'
import { dbPromise } from './database.js'

type Person = {
  _id: ObjectId
  name: string
  user: {
    _id: ObjectId
    picture_file: File
  }
  friends?: User[]
}

type Day = {
  _id: ObjectId
  people: Person[]
}

type Project = {
  _id: ObjectId
  user_id: ObjectId
  created_by: Person
  cronogram: {
    date: {
      day: number
      month: number
      year: number
    }
    assignments: {
      name: string
      status: string
      responsibles: Person[]
    }[]
  }[]
  cronogram_normalized: Day[]
  stakeholders: {
    owner: Person
    qa: Person
  }
}

type Post = {
  _id?: ObjectId
  replies: (Post | ObjectId)[]
  info: {
    user: {
      _id: ObjectId
    }
  }
}

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

  const postContext = await createContext({
    collectionName: 'post',
    token,
  })

  const { insertedIds: { '0': file1, '1': file2 } } = await db.collection('file').insertMany([
    { name: 'picture1.jpg' },
    { name: 'picture2.jpg' },
  ])

  const { insertedIds: { '0': user1, '1': user2, '2': user3 } } = await db.collection<Omit<User, '_id'>>('user').insertMany([
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

  const { insertedIds: { '0': person1, '1': person2, '2': person3 } } = await db.collection<PackReferences<Omit<Person, '_id'>>>('person').insertMany([
    {
      name: 'john',
      user: user1,
      friends: [
        user2,
        user3,
      ],
    },
    {
      name: 'terry',
      user: user2,
      friends: [user1],
    },
    {
      name: 'terry',
      user: user3,
    },
  ])

  const { insertedIds: { '0': day1, '1': day2 } } = await db.collection<PackReferences<Omit<Day, '_id'>>>('day').insertMany([
    {
      people: [
        person1,
        person2,
      ],
    },
    { people: [person3] },
  ])

  const project = throwIfError(await insert({
    what: {
      user_id: user1,
      created_by: person1,
      stakeholders: {
        owner: person1,
        qa: person2,
      },
      cronogram: [
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
              ],
            },
          ],
        },
      ],
      cronogram_normalized: [
        day1,
        day2,
      ],
    } satisfies PackReferences<Omit<Project, '_id'>>,
  }, projectContext)) as Project

  const { insertedId: post1 } = await db.collection<PackReferences<Post>>('post').insertOne({
    info: {
      user: user1,
    },
    replies: [],
  })

  const post2 = throwIfError(await insert({
    what: {
      info: {
        user: user1,
      },
      replies: [
        post1,
      ],
    },
  }, postContext))

  return {
    file1,
    file2,
    user1,
    user2,
    user3,
    person1,
    person2,
    person3,
    project,
    post1,
    post2,
  }
})()

