import type { GetTokenFunction, Token, AuthenticatedToken } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { getDatabaseCollection, decodeToken, traverseDocument, ObjectId } from '@aeriajs/core'

export const authenticationGuard = (decodedToken: Token): decodedToken is AuthenticatedToken => {
  decodedToken.authenticated = true
  return true
}

export const getToken: GetTokenFunction = async (request, context) => {
  if( !request.headers.authorization ) {
    return Result.result({
      authenticated: false,
      sub: null,
    })
  }

  const { error, result: decodedToken }= await decodeToken<Token>(typeof request.headers.authorization === 'string'
    ? request.headers.authorization.split('Bearer ').at(-1)!
    : '')

    if( error ) {
      return Result.error(error)
    }

  if( authenticationGuard(decodedToken) ) {
    if( typeof decodedToken.sub === 'string' ) {
      decodedToken.sub = new ObjectId(decodedToken.sub)
      Object.assign(decodedToken.userinfo, throwIfError(await traverseDocument(decodedToken.userinfo, context.collections.user.description, {
        autoCast: true,
      })))

      if( context.config.security.revalidateToken ) {
        const userCollection = getDatabaseCollection<{ roles: readonly string[] }>('user')
        const user = await userCollection.findOne({
          _id: decodedToken.sub,
          active: true,
        }, {
          projection: {
            roles: 1,
          },
        })

        if( !user ) {
          return Result.error(ACError.InvalidToken)
        }

        const rolesMatch = decodedToken.roles.every((role) => user.roles.includes(role))
        if( !rolesMatch ) {
          return Result.error(ACError.InvalidToken)
        }
      }
    }
  }

  return Result.result(decodedToken)
}

