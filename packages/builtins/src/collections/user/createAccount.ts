import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description.js'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { validate } from '@aeriajs/validation'
import * as bcrypt from 'bcryptjs'
import { insert as originalInsert } from '@aeriajs/core'

export const CreateAccountError = {
  SignupDisallowed: 'SIGNUP_DISALLOWED',
} as const

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

  const { error, result: user } = validate(userCandidate, {
    type: 'object',
    required: [
      'name',
      'email',
    ],
    properties: {
      name: {
        type: 'string',
      },
      email: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  })

  if( error ) {
    return context.error(HTTPStatus.UnprocessableContent, {
      code: ACError.MalformedInput,
      details: error,
    })
  }

  let roles: readonly string[] = [], defaults = {}
  if( context.config.security.signupDefaults ) {
    ({ roles = [], ...defaults } = context.config.security.signupDefaults)
  }

  if( user.password ) {
    user.password = await bcrypt.hash(user.password, 10)
  }

  const userWithExistingEmail = await context.collections.user.model.findOne({
    email: user.email,
  })
  if(userWithExistingEmail){
    return context.error(HTTPStatus.Forbidden, {
      code: ACError.OwnershipError,
    })
  }

  if( !context.token.authenticated ) {
    Object.assign(user, {
      self_registered: true,
    })
  }

  return originalInsert({
    what: {
      ...user,
      ...defaults,
      roles: Array.from(roles),
    },
  }, context)
}

