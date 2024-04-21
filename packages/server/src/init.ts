import type {
  Context,
  GenericRequest,
  ApiConfig,
  Token,
  AuthenticatedToken,
  NonCircularJsonSchema,
} from '@aeriajs/types'

import { ACErrors } from '@aeriajs/types'
import { right, left, isLeft, unwrapEither, unsafe, deepMerge } from '@aeriajs/common'
import { defineServerOptions, cors, wrapRouteExecution } from '@aeriajs/http'
import { registerServer } from '@aeriajs/node-http'

import { createContext, decodeToken, traverseDocument, ObjectId } from '@aeriajs/core'
import { getDatabase } from '@aeriajs/core'
import { DEFAULT_API_CONFIG } from './constants.js'
import { warmup } from './warmup.js'
import { registerRoutes } from './routes.js'

export type InitOptions = {
  config?: ApiConfig
  setup?: (context: Context)=> any
  callback?: (context: Context)=> any
  collections?: Record<string, {
    description: NonCircularJsonSchema
  }>
}

const authenticationGuard = (decodedToken: Token): decodedToken is AuthenticatedToken => {
  decodedToken.authenticated = true
  return true
}

export const getToken = async (request: GenericRequest, context: Context) => {
  if( !request.headers.authorization ) {
    return right(<Token>{
      authenticated: false,
      sub: null,
    })
  }

  try {
    const decodedToken: Token = await decodeToken(typeof request.headers.authorization === 'string'
      ? request.headers.authorization.split('Bearer ').pop()!
      : '')

    if( authenticationGuard(decodedToken) ) {
      if( decodedToken.sub ) {
        decodedToken.sub = new ObjectId(decodedToken.sub)
        Object.assign(decodedToken.userinfo, unsafe(await traverseDocument(decodedToken.userinfo, context.collections.user.description, {
          autoCast: true,
        })))
      }
    }

    return right(decodedToken)

  } catch( err ) {
    if( process.env.NODE_ENV === 'development' ) {
      console.trace(err)
    }

    return left(ACErrors.AuthenticationError)
  }
}

export const init = (_options: InitOptions = {}) => {
  const options = Object.assign({}, _options)
  options.config ??= {}
  Object.assign(options.config, deepMerge(DEFAULT_API_CONFIG, options.config))

  return {
    options,
    listen: async () => {
      const parentContext = await createContext({
        config: options.config,
      })

      if( options.setup ) {
        await options.setup(parentContext)
      }

      await warmup()

      const serverOptions = defineServerOptions()
      const apiRouter = registerRoutes()

      const server = registerServer(serverOptions, async (request, response) => {
        if( cors(request, response) === null ) {
          return
        }

        await wrapRouteExecution(response, async () => {
          const tokenEither = await getToken(request, parentContext)
          if( isLeft(tokenEither) ) {
            return tokenEither
          }

          const token = unwrapEither(tokenEither)
          const context = await createContext({
            parentContext,
            token,
          })

          Object.assign(context, {
            request,
            response,
          })

          if( options.callback ) {
            const result = await options.callback(context)
            if( result !== undefined ) {
              return result
            }
          }

          return apiRouter.install(context)
        })
      })

      if( !options.config?.database?.noDatabase ) {
        await getDatabase()
      }

      server.listen()
      return server
    },
  }
}

