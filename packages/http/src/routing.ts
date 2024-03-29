import type {
  Context,
  GenericRequest,
  GenericResponse,
  RequestMethod,
  InferProperty,
  InferResponse,
  PackReferences,
  ContractWithRoles,
} from '@aeriajs/types'

import { Stream } from 'stream'
import { ACErrors, REQUEST_METHODS } from '@aeriajs/types'
import { pipe, arraysIntersects, left, isLeft, unwrapEither, deepMerge } from '@aeriajs/common'
import { validate } from '@aeriajs/validation'
import { safeJson } from './payload.js'
import { DEFAULT_BASE_URI } from './constants.js'

export type RouteUri = `/${string}`

export type RouterOptions = {
  exhaust?: boolean
  base?: RouteUri
}

export type RoutesMeta = Record<
  RouteUri,
  Partial<Record<RequestMethod, ContractWithRoles | null> | undefined>
>

export type Middleware = (context: Context)=> any

export type RouteGroupOptions = {
  base?: RouteUri
}

type TypedContext<TContractWithRoles extends ContractWithRoles> = Omit<Context, 'request'> & {
  request: Omit<Context['request'], 'payload' | 'query'> & {
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
      ? TContractWithRoles['roles'] extends unknown[]
        ? TContractWithRoles['roles'][number] extends infer Role
          ? 'guest' extends Role
            ? (context: TypedContext<TContractWithRoles>)=> Response
            : (context: TypedContext<TContractWithRoles> & { token: { authenticated: true } })=> Response
          : never
        : (context: TypedContext<TContractWithRoles>)=> Response
      : never,
  >(
    exp: RouteUri,
    cb: TCallback,
    contract?: TContractWithRoles
  )=> ReturnType<typeof registerRoute>
>

const checkUnprocessable = (validationEither: ReturnType<typeof validate>, context: Context) => {
  if( isLeft(validationEither) ) {
    context.response.writeHead(422, {
      'content-type': 'application/json',
    })
    return validationEither
  }
}

const unsufficientRoles = (context: Context) => {
  context.response.writeHead(403, {
    'content-type': 'application/json',
  })

  return {
    error: ACErrors.AuthorizationError,
  }
}

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[] | null,
  exp: string | RegExp,
  options: RouterOptions,
) => {
  const { url } = req
  const { base = DEFAULT_BASE_URI } = options

  if( method && method !== req.method ) {
    if( !Array.isArray(method) || !method.includes(req.method) ) {
      return
    }
  }

  const regexp = exp instanceof RegExp
    ? exp
    : new RegExp(`^${base}${exp}$`)

  const matches = url.split('?')[0].match(regexp)

  if( matches ) {
    const fragments = matches.splice(1)
    return {
      fragments,
    }
  }
}

export const registerRoute = async (
  context: Context,
  method: RequestMethod | RequestMethod[],
  exp: RouteUri,
  cb: (context: Context)=> any,
  contract?: ContractWithRoles,
  options: RouterOptions = {},
) => {
  const match = matches(context.request, method, exp, options)
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
        context.response.writeHead(500)
        context.response.end(left({
          httpCode: 500,
          message: 'Invalid JSON',
        }))
        return null
      }
    }

    Object.assign(context.request, match)

    if( contract ) {
      if( contract.roles ) {
        if( !context.token.authenticated ) {
          if( !contract.roles.includes('guest') ) {
            return unsufficientRoles(context)
          }
        } else if( !arraysIntersects(context.token.roles, contract.roles) ) {
          return unsufficientRoles(context)
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

export const wrapRouteExecution = async (res: GenericResponse, cb: ()=> any | Promise<any>) => {
  try {
    const result = await cb()
    if( result === null ) {
      if( !res.headersSent ) {
        res.writeHead(204)
        res.end()
      }
      return
    }

    if( !res.headersSent && result && isLeft(result) ) {
      const error: any = unwrapEither(result)
      if( error.httpCode ) {
        res.writeHead(error.httpCode)
      }
    }

    if( result instanceof Stream ) {
      try {
        result.pipe(res)
      } catch( err ) {
      }
      return
    }

    if( !res.writableEnded ) {
      res.end(result)
    }

    return result

  } catch( e ) {
    console.trace(e)
    if( !res.headersSent ) {
      res.writeHead(500)
    }

    if( !res.writableEnded ) {
      const error = left({
        httpCode: 500,
        message: 'Internal server error',
      })

      res.end(error)
    }
  }
}

export const createRouter = (options: Partial<RouterOptions> = {}) => {
  const { exhaust } = options
  options.base ??= DEFAULT_BASE_URI

  const routes: ((_: unknown, context: Context, groupOptions?: RouteGroupOptions)=> ReturnType<typeof registerRoute>)[] = []
  const routesMeta = {} as RoutesMeta

  const route = <
    const TContractWithRoles extends ContractWithRoles,
    TCallback extends (
      TContractWithRoles extends { response: infer Response }
        ? InferResponse<Response>
        : any
    ) extends infer Response
      ? TContractWithRoles['roles'] extends unknown[]
        ? TContractWithRoles['roles'][number] extends infer Role
          ? 'guest' extends Role
            ? (context: TypedContext<TContractWithRoles>)=> Response
            : (context: TypedContext<TContractWithRoles> & { token: { authenticated: true } })=> Response
          : never
        : (context: TypedContext<TContractWithRoles>)=> Response
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
      install: (context: Context, options?: RouterOptions)=> any
      routesMeta: typeof routesMeta
    },
  >(exp: RouteUri, router: TRouter, middleware?: Middleware) => {
    const newOptions = Object.assign({}, options)

    for( const route in router.routesMeta ) {
      routesMeta[`${exp}${route}`] = router.routesMeta[route as keyof typeof router.routesMeta]
    }

    routes.push(async (_, context, groupOptions) => {
      newOptions.base = groupOptions
        ? `${groupOptions.base!}${exp}`
        : `${options.base!}${exp}`

      const match = matches(context.request, null, new RegExp(`^${newOptions.base}/`), newOptions)

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
    returnFirst: true,
  })

  const router = {
    route,
    routes,
    routesMeta,
    group,
    install: (_context: Context, _options?: RouterOptions) => {
      return {} as ReturnType<typeof routerPipe>
    },
  }

  router.install = async (context: Context, options?: RouterOptions) => {
    const result = await routerPipe(undefined, context, options)
    if( exhaust && result === undefined ) {
      return left({
        httpCode: 404,
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

