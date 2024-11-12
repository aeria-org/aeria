import type { User, File } from '@aeriajs/builtins'
import type { ObjectId } from '../../dist/index.js'

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

export type Post = {
  _id?: ObjectId
  replies: (Post | ObjectId)[]
  info: {
    user: {
      _id: ObjectId
    }
  }
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

