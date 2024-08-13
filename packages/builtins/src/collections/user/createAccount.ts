import type { Context, SchemaWithId } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { validate } from '@aeriajs/validation'
import * as bcrypt from 'bcrypt'

export const createAccount = async (
  payload: Partial<SchemaWithId<typeof description>>,
  context: Context<typeof description>,
) => {
  const userCandidate = Object.assign({}, payload)

  if( !context.config.security.allowSignup ) {
    throw new Error('signup disallowed')
  }

  delete userCandidate._id
  delete userCandidate.roles
  delete userCandidate.active

  const { error, result: user } = validate(userCandidate, {
    type: 'object',
    required: [
      'name',
      'email',
      'phone_number',
    ],
    properties: {
      name: {
        type: 'string',
      },
      email: {
        type: 'string',
      },
      phone_number: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  })

  if( error ) {
    return context.error(HTTPStatus.BadRequest, {
      code: ACError.MalformedInput,
      details: error,
    })
  }

  if( context.config.security.signupDefaults ) {
    Object.assign(user, context.config.security.signupDefaults)
  }

  if( user.password ) {
    user.password = await bcrypt.hash(user.password, 10)
  }

  if( !context.token.authenticated ) {
    Object.assign(user, {
      self_registered: true,
    })
  }

  const { insertedId } = await context.collection.model.insertOne(user)
  const newUser = await context.collection.model.findOne({
    _id: insertedId,
  })

  if( !newUser ) {
    throw new Error()
  }

  return Result.result(newUser)
}

