import type { User, File } from '@aeriajs/builtins'
import type { ObjectId } from '../../dist/index.js'

export type UnpackReferences<T> = T extends object
  ? {
    [P in keyof T]: P extends '_id'
      ? T[P]
      : ObjectId extends T[P]
        ? UnpackReferences<Exclude<T[P], ObjectId>>
        : T[P] extends (infer E)[]
          ? ObjectId extends E
            ? UnpackReferences<Exclude<E, ObjectId>>[]
            : E[]
          : T[P]
  }
  : T

export type Person = {
  _id: ObjectId
  name: string
  user: {
    _id: ObjectId
    picture_file: File
  }
  friends?: User[]
}

export type Day = {
  _id: ObjectId
  people: Person[]
}

export type Project = {
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

export type Comment = {
  _id?: ObjectId
  meta: {
    user: {
      _id: ObjectId
    }
  }
}

export type Post = {
  _id?: ObjectId
  title: string
  single_comment: Comment | ObjectId
  comments: (Comment | ObjectId)[]
}

export type Featured = {
  _id?: ObjectId
  post: Post | ObjectId
}

export type CircularA = {
  _id: ObjectId
  name: string
  circularA?: CircularA
  circularAs?: CircularA[]
  circularB?: CircularB
  circularB_array?: CircularB[]
}

export type CircularB = {
  _id: ObjectId
  name: string
  circularA: CircularA
}

