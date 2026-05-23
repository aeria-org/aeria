import type { RouteContext, Collection, ApiConfig, NonCircularJsonSchema, Token } from '@aeriajs/types'
import { ACError, HTTPStatus, Result } from '@aeriajs/types'
import { deepMerge, endpointError } from '@aeriajs/common'
import { cors, wrapRouteExecution, type createRouter } from '@aeriajs/http'
import { registerServer } from '@aeriajs/node-http'
import { createContext, getDatabase } from '@aeriajs/core'
import { DEFAULT_API_CONFIG } from './constants.js'
import { warmup } from './warmup.js'
import { registerRoutes } from './routes.js'
import { getToken } from './getToken.js'

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
          let result: null | undefined
          switch( typeof config.server.cors ) {
            case 'function': {
              result = await config.server.cors(request, response, DEFAULT_API_CONFIG.server.cors)
              break
            }
            case 'object': {
              result = await cors(request, response, config.server.cors)
              break
            }
          }

          if( result === null ) {
            return
          }
        }

        await wrapRouteExecution(response, async () => {
          const getTokenFn = config.server?.getToken
            ? config.server.getToken
            : getToken

          let token: Token
          try {
            const { error, result } = await getTokenFn(request, parentContext)
            if( error ) {
              return Result.error(error)
            }

            token = result!
          } catch( err ) {
            if( process.env.NODE_ENV === 'development' ) {
              console.trace(err)
            }

            return endpointError({
              httpStatus: HTTPStatus.Unauthorized,
              code: ACError.AuthenticationError,
            })
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

