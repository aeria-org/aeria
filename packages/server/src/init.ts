import type { RouteContext, Collection, GenericRequest, ApiConfig, Token, AuthenticatedToken, NonCircularJsonSchema } from '@aeriajs/types'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { endpointError, throwIfError, deepMerge } from '@aeriajs/common'
import { cors, wrapRouteExecution, type createRouter } from '@aeriajs/http'
import { registerServer } from '@aeriajs/node-http'
import { createContext, getDatabase, getDatabaseCollection, decodeToken, traverseDocument, ObjectId } from '@aeriajs/core'
import { DEFAULT_API_CONFIG } from './constants.js'
import { warmup } from './warmup.js'
import { registerRoutes } from './routes.js'

type DeepPartial<T> = T extends Record<string, unknown>
  ? {
    [P in keyof T]?: DeepPartial<T[P]>
  }
  : T

export type InitApiConfig = Omit<ApiConfig, keyof typeof DEFAULT_API_CONFIG> & DeepPartial<Pick<
  ApiConfig,
  keyof typeof DEFAULT_API_CONFIG
>>

export type InitOptions = {
  config?: InitApiConfig
  router?: ReturnType<typeof createRouter>
  setup?: (context: RouteContext)=> unknown
  callback?: (context: RouteContext)=> unknown
  collections?: Record<string, Omit<Collection, 'item'> & {
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

  const config: ApiConfig = Object.assign(options.config, deepMerge(DEFAULT_API_CONFIG, options.config))

  return {
    options,
    listen: async () => {
      if( !config.server ) {
        throw new Error
      }

      const parentContext = await createContext({
        config,
      })

      if( options.setup ) {
        await options.setup(parentContext)
      }

      if( !config.server.noWarmup ) {
        await warmup()
      }

      const apiRouter = registerRoutes()

      const server = registerServer(config.server, async (request, response) => {
        if( config.server && config.server.cors ) {
          if( cors(request, response, config.server.cors) === null ) {
            return
          }
        }

        await wrapRouteExecution(response, async () => {
          const { error, result: token } = await getToken(request, parentContext)
          if( error ) {
            return Result.error(error)
          }

          const context = await createContext({
            parentContext,
            token,
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
            const result = await options.router.handle(request, response, context)
            if( result !== undefined ) {
              return result
            }
          }

          return apiRouter.handle(request, response, context)
        })
      })

      if( !config.database?.noDatabase ) {
        await getDatabase()
      }

      server.listen()
      return server
    },
  }
}

