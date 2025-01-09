import type { Context, SchemaWithId, InsertPayload, Description, UserRole } from '@aeriajs/types'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { arraysIntersect } from '@aeriajs/common'
import { ObjectId, insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

const isRoleAllowed = (targetRole: UserRole, context: Context) => {
  if( !context.config.security.rolesHierarchy || !context.token.authenticated ) {
    throw new Error
  }

  for( const role of context.token.roles ) {
    if( role in context.config.security.rolesHierarchy ) {
      const hierarchy = context.config.security.rolesHierarchy[role]
      if( !hierarchy ) {
        continue
      }

      if( hierarchy === true || hierarchy.includes(targetRole) ) {
        return true
      }
    }
  }

  return false
}

export const insert = async <
  TDescription extends Description,
  TInsertPayload extends InsertPayload<SchemaWithId<TDescription>>,
>(
  payload: NoInfer<TInsertPayload>,
  context: Context<TDescription>,
) => {
  if( !context.token.authenticated ) {
    throw new Error
  }

  if( 'roles' in payload.what ) {
    if( context.config.security.rolesHierarchy ) {
      if( !arraysIntersect(context.token.roles as string[], Object.keys(context.config.security.rolesHierarchy)) ) {
        return context.error(HTTPStatus.Forbidden, {
          code: ACError.AuthorizationError,
          message: 'user is not allowed to edit other users roles',
        })
      }

      if( Array.isArray(payload.what.roles) ) {
        const allowed = payload.what.roles.every((role) => isRoleAllowed(role, context))
        if( !allowed ) {
          return context.error(HTTPStatus.Forbidden, {
            code: ACError.AuthorizationError,
            message: 'tried to set unallowed roles',
          })
        }
      }

      if( '_id' in payload.what && typeof payload.what._id === 'string' ) {
        const user = await context.collections.user.model.findOne({
          _id: new ObjectId(payload.what._id),
        })

        if( !user ) {
          return context.error(HTTPStatus.NotFound, {
            code: ACError.ResourceNotFound,
          })
        }

        const allowed = user.roles.every((role) => isRoleAllowed(role as UserRole, context))
        if( !allowed ) {
          return context.error(HTTPStatus.Forbidden, {
            code: ACError.AuthorizationError,
            message: 'tried to edit an user with a role higher in the hierarchy',
          })
        }
      }
    }
  }

  if( 'password' in payload.what && typeof payload.what.password === 'string' ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return originalInsert(payload, context)
}

