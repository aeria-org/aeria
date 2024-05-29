import type {
  RouteContext,
  GenericRequest,
  GenericResponse,
  RequestMethod,
  RouteUri,
  InferProperty,
  InferResponse,
  PackReferences,
  ContractWithRoles,
  ApiConfig,
  RoleFromAccessCondition,
} from '@aeriajs/types'

import { Stream } from 'stream'
import { ACError, HTTPStatus, REQUEST_METHODS } from '@aeriajs/types'
import { pipe, isGranted, isLeft, unwrapEither, deepMerge, error } from '@aeriajs/common'
import { validate } from '@aeriajs/validation'
import { getConfig } from '@aeriajs/entrypoint'
import { safeJson } from './payload.js'
import { isNext } from './next.js'

export type RouterOptions = {
  exhaust?: boolean
  base?: RouteUri
}

export type RoutesMeta = Record<
  RouteUri,
  Partial<Record<RequestMethod, ContractWithRoles | null> | undefined>
>

export type Middleware = (context: RouteContext)=> any

export type RouteGroupOptions = {
  base?: RouteUri
}

type TypedContext<TContractWithRoles extends ContractWithRoles> = RouteContext<RoleFromAccessCondition<TContractWithRoles['roles']>> & {
  request: Omit<RouteContext['request'], 'payload' | 'query'> & {
    payload: TContractWithRoles extends { payload: infer Payload }
      ? PackReferences<InferProperty<Payload>>
      : any
    query: TContractWithRoles extends { query: infer Query }
      ? InferProperty<Query>
      : any
  }
}

export type ProxiedRouter<TRouter> = TRouter & Record<
  RequestMethod,
  <
    const TContractWithRoles extends ContractWithRoles,
    TCallback extends (
      TContractWithRoles extends { response: infer Response }
        ? InferResponse<Response>
        : any
    ) extends infer Response
      ? (context: TypedContext<TContractWithRoles>)=> Response
      : never,
  >(
    exp: RouteUri,
    cb: TCallback,
    contract?: TContractWithRoles
  )=> ReturnType<typeof registerRoute>
>

const checkUnprocessable = (validationEither: ReturnType<typeof validate>, context: RouteContext) => {
  if( isLeft(validationEither) ) {
    const validationError = unwrapEither(validationEither)
    if( 'code' in validationError ) {
      return context.error(HTTPStatus.UnprocessableContent, {
        code: validationError.code,
        details: validationError.errors,
      })
    }

    return context.error(HTTPStatus.UnprocessableContent, {
      code: 'UNPROCESSABLE_ENTITY',
      message: 'the provided payload is unprocessable',
      details: validationError,
    })
  }
}

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[] | null,
  exp: string | RegExp,
  options: RouterOptions,
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

export const registerRoute = async (
  context: RouteContext,
  method: RequestMethod | RequestMethod[],
  exp: RouteUri,
  cb: (context: RouteContext)=> any,
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
        context.request.payload = deepMerge(
          safeJson(context.request.body),
          context.request.payload as any || {},
          {
            arrays: false,
          },
        )

      } catch( err ) {
        return context.error(HTTPStatus.UnprocessableContent, {
          code: 'INVALID_JSON',
          message: 'Invalid JSON',
        })
      }
    }

    Object.assign(context.request, match)

    if( contract ) {
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
        const validationEither = validate(context.request.payload, contract.payload)
        const error = checkUnprocessable(validationEither, context)
        if( error ) {
          return error
        }
      }

      if( 'query' in contract && contract.query ) {
        const validationEither = validate(context.request.query, contract.query, {
          coerce: true,
        })

        const error = checkUnprocessable(validationEither, context)
        if( error ) {
          return error
        }
      }
    }

    const result = await cb(context)
    return result === undefined
      ? null
      : result
  }
}

export const wrapRouteExecution = async (response: GenericResponse, cb: ()=> any | Promise<any>) => {
  try {
    const result = await cb()
    if( result === null ) {
      if( !response.headersSent ) {
        response.writeHead(204)
      }
      response.end(result)
      return
    }

    if( result instanceof Stream ) {
      try {
        result.pipe(response)
      } catch( err ) {
      }
      return
    }

    if( !response.writableEnded ) {
      response.end(result)
    }

    return result

  } catch( e ) {
    console.trace(e)
    if( !response.headersSent ) {
      response.writeHead(500)
    }

    if( !response.writableEnded ) {
      return error({
        httpStatus: 500,
        code: 'UNKNOWN_ERROR',
        message: 'Internal server error',
      })
    }
  }
}

export const createRouter = (options: Partial<RouterOptions> = {}) => {
  const { exhaust } = options

  const routes: ((_: unknown, context: RouteContext, groupOptions?: RouteGroupOptions)=> ReturnType<typeof registerRoute>)[] = []
  const routesMeta = {} as RoutesMeta

  const route = <
    const TContractWithRoles extends ContractWithRoles,
    TCallback extends (
      TContractWithRoles extends { response: infer Response }
        ? InferResponse<Response>
        : any
    ) extends infer Response
      ? (context: TypedContext<TContractWithRoles>)=> Response
      : never,
  >(
    method: RequestMethod | RequestMethod[],
    exp: RouteUri,
    cb: TCallback,
    contract?: TContractWithRoles,
  ) => {
    routesMeta[exp] ??= {}
    routesMeta[exp]![Array.isArray(method)
      ? method[0]
      : method] = contract || null

    routes.push((_, context, groupOptions) => {
      return registerRoute(
        context,
        method,
        exp,
        cb as any,
        contract,
        groupOptions || options,
      )
    })
  }

  const group = <
    TRouter extends {
      install: (context: RouteContext, options?: RouterOptions)=> any
      routesMeta: typeof routesMeta
    },
  >(exp: RouteUri, router: TRouter, middleware?: Middleware) => {
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

        return router.install(context, newOptions)
      }
    })
  }

  const routerPipe = pipe(routes, {
    returnFirst: (value) => {
      if( value !== undefined && !isNext(value) ) {
        return value
      }
    },
  })

  const router = {
    route,
    routes,
    routesMeta,
    group,
    install: (_context: RouteContext, _options?: RouterOptions) => {
      return {} as ReturnType<typeof routerPipe>
    },
  }

  router.install = async (context: RouteContext, options?: RouterOptions) => {
    const result = await routerPipe(undefined, context, options)
    if( exhaust && (result === undefined || isNext(result)) ) {
      return context.error(HTTPStatus.NotFound, {
        code: 'NOT_FOUND',
        message: 'Not found',
      })
    }

    return result
  }

  return new Proxy(router as ProxiedRouter<typeof router>, {
    get: (target, key) => {
      if( REQUEST_METHODS.includes(key as any) ) {
        return (...args: Parameters<typeof target.route> extends [any, ...infer Params]
          ? Params
          : never) => target.route(key as RequestMethod, ...args)
      }

      return target[key as keyof typeof target]
    },
  })
}

