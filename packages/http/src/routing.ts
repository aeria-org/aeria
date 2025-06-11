import type {
  RouteContext,
  GenericRequest,
  GenericResponse,
  RequestMethod,
  RouteUri,
  InferProperties,
  PackReferences,
  ContractWithRoles,
  ApiConfig,
  Property,
} from '@aeriajs/types'

import { Stream } from 'node:stream'
import { ObjectId } from 'mongodb'
import { Result, ACError, HTTPStatus, REQUEST_METHODS, STREAMED_RESPONSE } from '@aeriajs/types'
import { pipe, isGranted, deepMerge, endpointError } from '@aeriajs/common'
import { validateWithRefs, type ValidateOptions } from '@aeriajs/validation'
import { getConfig } from '@aeriajs/entrypoint'
import { safeJson } from './payload.js'

export type RouterOptions = {
  exhaust?: boolean
  base?: RouteUri
}

export type RoutesMeta = Record<
  RouteUri,
  Partial<Record<RequestMethod, ContractWithRoles | null> | undefined>
>

export type RouteGroupOptions = {
  base?: RouteUri
}

type NarrowedContext<TContractWithRoles extends ContractWithRoles> = Omit<RouteContext<TContractWithRoles['roles']>, 'request'> & {
  request: Omit<RouteContext['request'], 'payload' | 'query'> & {
    payload: TContractWithRoles extends { payload: infer Payload }
      ? PackReferences<InferProperties<Payload>>
      : Record<string, unknown>
    query: TContractWithRoles extends { query: infer Query }
      ? PackReferences<InferProperties<Query>>
      : Record<string, unknown>
  }
}

export type ProxiedRouter<TRouter> = TRouter & Record<
  typeof REQUEST_METHODS[number],
  <
    const TContractWithRoles extends ContractWithRoles,
    TCallback extends (
      TContractWithRoles extends { response: infer Response }
        ? InferProperties<Response> extends infer InferredResponse
          ? InferredResponse | Promise<InferredResponse>
          : never
        : unknown
    ) extends infer Response
      ? (context: NarrowedContext<TContractWithRoles>)=> Response
      : never,
  >(
    exp: RouteUri,
    cb: TCallback,
    contract?: TContractWithRoles
  )=> ReturnType<typeof registerRoute>
>

const checkUnprocessable = async (
  what: unknown,
  schema: Property | Property[],
  context: RouteContext,
  validateOptions: ValidateOptions = {},
) => {
  let result: Awaited<ReturnType<typeof validateWithRefs>>

  if( Array.isArray(schema) ) {
    for( const property of schema ) {
      result = await validateWithRefs(what, property, validateOptions)
      if( !result.error ) {
        break
      }
    }
  } else {
    result = await validateWithRefs(what, schema, validateOptions)
  }

  const { error, result: validated } = result!
  if( error ) {
    if( 'code' in error ) {
      return context.error(HTTPStatus.UnprocessableContent, {
        code: error.code,
        details: error.details,
      })
    }

    return context.error(HTTPStatus.UnprocessableContent, {
      code: ACError.MalformedInput,
      message: 'the provided payload is unprocessable',
      details: error,
    })
  }

  return Result.result(validated)
}

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[] | null,
  exp: string | RegExp,
  options: RouterOptions = {},
  config?: ApiConfig,
) => {
  const base = config?.baseUrl && config.baseUrl !== '/'
    ? options.base
      ? `${config.baseUrl}${options.base}`
      : config.baseUrl
    : options.base
      ? options.base
      : ''

  if( method && method !== req.method ) {
    if( !Array.isArray(method) || !method.includes(req.method) ) {
      return
    }
  }

  const regexp = exp instanceof RegExp
    ? exp
    : new RegExp(`^${base}${exp}$`)

  const url = new URL(`http://0.com${req.url}`).pathname
  const expMatches = url.match(regexp)

  if( expMatches ) {
    const fragments = expMatches.splice(1)
    return {
      fragments,
    }
  }
}

export const registerRoute = async <TRouteContext extends RouteContext>(
  context: TRouteContext,
  method: RequestMethod | RequestMethod[],
  exp: RouteUri,
  cb: (context: TRouteContext)=> unknown,
  contract?: ContractWithRoles,
  options: RouterOptions = {},
) => {
  const config = await getConfig()
  const match = matches(
    context.request,
    method,
    exp,
    options,
    config,
  )

  if( match ) {
    if( context.request.headers['content-type'] === 'application/json' ) {
      try {
        context.request.payload = deepMerge(safeJson(context.request.body), context.request.payload, {
          arrays: false,
        })

      } catch( err ) {
        return context.error(HTTPStatus.UnprocessableContent, {
          code: ACError.MalformedInput,
          message: 'Invalid JSON',
        })
      }
    }

    Object.assign(context.request, match)

    if( contract ) {
      if( contract.streamed ) {
        context.response[STREAMED_RESPONSE] = true
      }

      if( contract.roles ) {
        const granted = isGranted(contract.roles, context.token)
        if( !granted ) {
          return context.error(HTTPStatus.Unauthorized, {
            code: ACError.AuthorizationError,
            message: 'your roles dont grant access to this route',
          })
        }
      }

      if( 'payload' in contract && contract.payload ) {
        const { error } = await checkUnprocessable(context.request.payload, contract.payload, context, {
          checkObjectIds: true,
          context,
          objectIdConstructor: ObjectId,
        })
        if( error ) {
          return Result.error(error)
        }
      }

      if( 'query' in contract && contract.query ) {
        const { error, result: validated } = await checkUnprocessable(context.request.query, contract.query, context, {
          checkObjectIds: true,
          coerce: true,
          context,
          objectIdConstructor: ObjectId,
        })
        if( error ) {
          return Result.error(error)
        }
        context.request.query = validated
      }
    }

    const result = await cb(context)
    return result === undefined
      ? null
      : result
  }
}

export const wrapRouteExecution = async (response: GenericResponse, cb: ()=> unknown | Promise<unknown>) => {
  try {
    const result = await cb()

    if( response[STREAMED_RESPONSE] && !result ) {
      return
    }

    if( result instanceof Stream ) {
      try {
        result.pipe(response)
      } catch( err ) {
      }
      return
    }

    if( result === null ) {
      if( !response.headersSent ) {
        response.writeHead(HTTPStatus.NoContent)
      }
      response.end(result)
      return
    }

    if( !response.writableEnded ) {
      response.end(result)
    }

    return result

  } catch( e ) {
    console.trace(e)
    if( !response.headersSent ) {
      response.writeHead(HTTPStatus.InternalServerError)
    }

    if( !response.writableEnded ) {
      return endpointError({
        httpStatus: HTTPStatus.InternalServerError,
        code: ACError.UnknownError,
        message: 'Internal server error',
      })
    }
  }
}

export const createRouter = (options: Partial<RouterOptions> = {}) => {
  const { exhaust } = options

  const routes: ((_: unknown, context: RouteContext, groupOptions?: RouteGroupOptions)=> unknown)[] = []
  const routesMeta: RoutesMeta = {}

  const route = <
    const TContractWithRoles extends ContractWithRoles,
    TCallback extends (
      TContractWithRoles extends { response: infer Response }
        ? InferProperties<Response>
        : unknown
    ) extends infer Response
      ? (context: NarrowedContext<TContractWithRoles>)=> Response
      : never,
  >(
    method: RequestMethod | RequestMethod[],
    exp: RouteUri,
    cb: TCallback,
    contract?: TContractWithRoles,
  ) => {
    routesMeta[exp] ??= {}
    routesMeta[exp][Array.isArray(method)
      ? method[0]
      : method] = contract || null

    routes.push((_, context, groupOptions) => {
      return registerRoute(
        context as NarrowedContext<TContractWithRoles>,
        method,
        exp,
        cb,
        contract,
        groupOptions || options,
      )
    })
  }

  const group = <
    TRouter extends {
      handle: (request: GenericRequest, response: GenericResponse, context: RouteContext, options?: RouterOptions)=> unknown
      routesMeta: typeof routesMeta
    },
  >(exp: RouteUri, router: TRouter, middleware?: (context: RouteContext)=> unknown) => {
    const newOptions = Object.assign({}, options)

    for( const route in router.routesMeta ) {
      routesMeta[`${exp}${route}`] = router.routesMeta[route as keyof typeof router.routesMeta]
    }

    routes.push(async (_, context, groupOptions) => {
      const config = await getConfig()
      const base = groupOptions
        ? groupOptions.base
        : options.base

      newOptions.base = base && base !== '/'
        ? `${base}${exp}`
        : exp

      const match = matches(
        context.request,
        null,
        config.baseUrl === '/'
          ? new RegExp(`^${newOptions.base}/`)
          : new RegExp(`^${config.baseUrl}${newOptions.base}/`),
        newOptions,
      )

      if( match ) {
        if( middleware ) {
          const result = await middleware(context)
          if( result ) {
            return result
          }
        }

        return router.handle(context.request, context.response, context, newOptions)
      }
    })
  }

  const routerPipe = pipe(routes, {
    returnFirst: (value) => {
      if( value !== undefined ) {
        return value
      }
    },
  })

  const router = {
    route,
    routes,
    routesMeta,
    group,
    handle: async (request: GenericRequest, response: GenericResponse, context: RouteContext, options?: RouterOptions) => {
      context.request = request
      context.response = response

      const result = await routerPipe(undefined, context, options)
      if( exhaust && result === undefined ) {
        return context.error(HTTPStatus.NotFound, {
          code: ACError.ResourceNotFound,
          message: 'Not found',
        })
      }
      return result
    },
  }

  return new Proxy(router as ProxiedRouter<typeof router>, {
    get: (target, key) => {
      if( REQUEST_METHODS.includes(key as typeof REQUEST_METHODS[number]) ) {
        return (...args: Parameters<typeof target.route> extends [unknown, ...infer Params]
          ? Params
          : never) => target.route(key as RequestMethod, ...args)
      }

      return target[key as keyof typeof target]
    },
  })
}

