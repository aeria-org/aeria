import type { RouteContext, Collection, GenericRequest, ApiConfig, Token, AuthenticatedToken, NonCircularJsonSchema } from '@aeriajs/types'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { endpointError, throwIfError, deepMerge } from '@aeriajs/common'
import { defineServerOptions, cors, wrapRouteExecution, type createRouter } from '@aeriajs/http'
import { registerServer } from '@aeriajs/node-http'

import { createContext, decodeToken, traverseDocument, ObjectId } from '@aeriajs/core'
import { getDatabase } from '@aeriajs/core'
import { DEFAULT_API_CONFIG } from './constants.js'
import { warmup } from './warmup.js'
import { registerRoutes } from './routes.js'

export type InitApiConfig = Omit<ApiConfig, keyof typeof DEFAULT_API_CONFIG> & Partial<Pick<
  ApiConfig,
  keyof typeof DEFAULT_API_CONFIG
>>

export type InitOptions = {
  config?: InitApiConfig
  router?: ReturnType<typeof createRouter>
  setup?: (context: RouteContext)=> unknown
  callback?: (context: RouteContext)=> unknown
  collections?: Record<string, Collection & {
    description: NonCircularJsonSchema
  }>
}

const authenticationGuard = (decodedToken: Token): decodedToken is AuthenticatedToken => {
  decodedToken.authenticated = true
  return true
}

export const getToken = async (request: GenericRequest, context: RouteContext) => {
  if( !request.headers.authorization ) {
    return Result.result({
      authenticated: false,
      sub: null,
    } satisfies Token)
  }

  try {
    const decodedToken: Token = await decodeToken(typeof request.headers.authorization === 'string'
      ? request.headers.authorization.split('Bearer ').at(-1)!
      : '')

    if( authenticationGuard(decodedToken) ) {
      if( typeof decodedToken.sub === 'string' ) {
        decodedToken.sub = new ObjectId(decodedToken.sub)
        Object.assign(decodedToken.userinfo, throwIfError(await traverseDocument(decodedToken.userinfo, context.collections.user.description, {
          autoCast: true,
        })))
      }
    }

    return Result.result(decodedToken)

  } catch( err ) {
    if( process.env.NODE_ENV === 'development' ) {
      console.trace(err)
    }

    return endpointError({
      httpStatus: HTTPStatus.Unauthorized,
      code: ACError.AuthenticationError,
    })
  }
}

export const init = (_options: InitOptions = {}) => {
  const options = Object.assign({
    config: {},
  }, _options)

  Object.assign(options.config, deepMerge(DEFAULT_API_CONFIG, options.config))

  return {
    options,
    listen: async () => {
      const parentContext = await createContext({
        config: <ApiConfig>options.config,
      })

      if( options.setup ) {
        await options.setup(parentContext)
      }

      if( !options.config.noWarmup ) {
        await warmup()
      }

      const serverOptions = defineServerOptions({
        host: options.config.host,
        port: options.config.port,
      })

      const apiRouter = registerRoutes()

      const server = registerServer(serverOptions, async (request, response) => {
        if( cors(request, response) === null ) {
          return
        }

        await wrapRouteExecution(response, async () => {
          const { error, result: token } = await getToken(request, parentContext)
          if( error ) {
            return Result.error(error)
          }

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

          if( options.router ) {
            const result = await options.router.install(context)
            if( result !== undefined ) {
              return result
            }
          }

          return apiRouter.install(context)
        })
      })

      if( !options.config.database?.noDatabase ) {
        await getDatabase()
      }

      server.listen()
      return server
    },
  }
}

