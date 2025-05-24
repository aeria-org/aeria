import type { PackReferences, Token } from '@aeriajs/types'
import type { User } from '@aeriajs/builtins'
import type { Person, Day, Project, Post, Comment, Featured } from './types.js'
import { throwIfError } from '@aeriajs/common'
import { createContext, insert } from '../../dist/index.js'
import { dbPromise } from './database.js'

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

  const featuredCountext = await createContext({
    collectionName: 'featured',
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

  const { insertedIds: { 0: comment1, 1: comment2 } } = await db.collection<PackReferences<Omit<Comment, '_id'>>>('comment').insertMany([
    { meta: { user: user1 } },
    { meta: { user: user2 } },
  ])

  const post1 = throwIfError(await insert({
    what: {
      title: 'Hello, world',
      single_comment: comment1,
      comments: [
        comment1,
        comment2,
      ],
    } satisfies PackReferences<Omit<Post, '_id'>>,
  }, postContext)) as Post

  const featured1 = throwIfError(await insert({ what: { post: post1._id! } satisfies PackReferences<Omit<Featured, '_id'>> }, featuredCountext)) as Featured

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
    featured1,
  }
})()

