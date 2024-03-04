import type { Context, GenericRequest, ApiConfig, DecodedToken, NonCircularJsonSchema } from '@aeriajs/types'
import { right, left, isLeft, unwrapEither, unsafe, deepMerge } from '@aeriajs/common'
import { defineServerOptions, cors, wrapRouteExecution } from '@aeriajs/http'
import { registerServer } from '@aeriajs/node-http'

import { createContext, decodeToken, traverseDocument } from '@aeriajs/api'
import { getDatabase } from '@aeriajs/api'
import { DEFAULT_API_CONFIG } from './constants.js'
import { warmup } from './warmup.js'
import { registerRoutes } from './routes.js'

export type InitOptions = {
  config?: ApiConfig
  callback?: (context: Context)=> any
  collections?: Record<string, {
    description: NonCircularJsonSchema
  }>
}

export const getDecodedToken = async (request: GenericRequest, context: Context) => {
  if( !request.headers.authorization ) {
    return right(<DecodedToken>{
      authenticated: false,
      sub: null,
    })
  }

  try {
    const decodedToken: DecodedToken = await decodeToken(request.headers.authorization.split('Bearer ').pop() || '')
    decodedToken.authenticated = true
    Object.assign(decodedToken, unsafe(await traverseDocument(decodedToken, context.collections.user.description, {
      autoCast: true,
    })))

    return right(decodedToken)

  } catch( err ) {
    if( process.env.NODE_ENV === 'development' ) {
      console.trace(err)
    }

    return left('AUTHENTICATION_ERROR')
  }
}

export const init = <const TInitOptions extends InitOptions>(_options: TInitOptions) => {
  const options = Object.assign({}, _options)
  options.config ??= {}
  Object.assign(options.config, deepMerge(DEFAULT_API_CONFIG, options.config))

  return {
    options,
    listen: async () => {
      const parentContext = await createContext({
        config: options.config,
      })

      console.time('warmup')
      void await warmup()

      console.log()
      console.timeEnd('warmup')

      const serverOptions = defineServerOptions()
      const apiRouter = registerRoutes()

      const server = registerServer(serverOptions, async (request, response) => {
        if( cors(request, response) === null ) {
          return
        }

        await wrapRouteExecution(response, async () => {
          const tokenEither = await getDecodedToken(request, parentContext)
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
        void await getDatabase()
      }

      server.listen()
      return server
    },
  }
}

