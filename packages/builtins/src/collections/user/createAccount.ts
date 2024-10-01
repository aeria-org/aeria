import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description.js'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { validate } from '@aeriajs/validation'
import * as bcrypt from 'bcrypt'

export enum CreateAccountError {
  SignupDisallowed = 'SIGNUP_DISALLOWED',
}

export const createAccount = async (
  payload: Partial<PackReferences<SchemaWithId<typeof description>>> & Record<string, unknown>,
  context: Context<typeof description>,
) => {
  const userCandidate = Object.assign({}, payload)

  if( !context.config.security.allowSignup ) {
    return context.error(HTTPStatus.Forbidden, {
      code: CreateAccountError.SignupDisallowed,
    })
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

  let roles: string[] = [], defaults = {}
  if( context.config.security.signupDefaults ) {
    ({ roles = [], ...defaults } = context.config.security.signupDefaults)
  }

  if( user.password ) {
    user.password = await bcrypt.hash(user.password, 10)
  }

  if( !context.token.authenticated ) {
    Object.assign(user, {
      self_registered: true,
    })
  }

  return context.collections.user.functions.insert({
    what: {
      ...user,
      ...defaults,
      roles,
    },
  })
}

