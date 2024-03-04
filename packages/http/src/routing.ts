import type {
  Context,
  GenericRequest,
  GenericResponse,
  RequestMethod,
  InferProperty,
  InferResponse,
  PackReferences,
} from '@aeriajs/types'
import type { Contract } from './contract.js'

import { REQUEST_METHODS } from '@aeriajs/types'
import { Stream } from 'stream'
import { pipe, left, isLeft, unwrapEither, deepMerge } from '@aeriajs/common'
import { validate } from '@aeriajs/validation'
import { safeJson } from './payload.js'
import { DEFAULT_BASE_URI } from './constants.js'

export type RouteUri = `/${string}`

export type RouterOptions = {
  exhaust?: boolean
  base?: RouteUri
}

export type Middleware = (context: Context)=> any

export type RouteGroupOptions = {
  base?: RouteUri
}

type TypedContext<TContract extends Contract> = Omit<Context, 'request'> & {
  request: Omit<Context['request'], 'payload' | 'query'> & {
    payload: TContract extends { payload: infer Payload }
      ? PackReferences<InferProperty<Payload>>
      : never
    query: TContract extends { query: infer Query }
      ? InferProperty<Query>
      : any
  }
}

export type ProxiedRouter<TRouter> = TRouter & Record<
  RequestMethod,
  <
    TCallback extends (context: TypedContext<TContract>)=> TContract extends { response: infer Response }
      ? InferResponse<Response>
      : any,
    const TContract extends Contract,
  >(
    exp: RouteUri,
    cb: TCallback,
    contract?: TContract
  )=> ReturnType<typeof registerRoute>
>

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

export const registerRoute = async <TCallback extends (context: Context)=> any>(
  context: Context,
  method: RequestMethod | RequestMethod[],
  exp: RouteUri,
  cb: TCallback,
  contract?: Contract,
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
      const checkUnprocessable = (validationEither: ReturnType<typeof validate>) => {
        if( isLeft(validationEither) ) {
          context.response.writeHead(422, {
            'content-type': 'application/json',
          })
          return validationEither
        }
      }

      if( 'payload' in contract && contract.payload ) {
        const validationEither = validate(context.request.payload, contract.payload)
        const error = checkUnprocessable(validationEither)
        if( error ) {
          return error
        }
      }

      if( 'query' in contract && contract.query ) {
        const validationEither = validate(context.request.query, contract.query, {
          coerce: true,
        })

        const error = checkUnprocessable(validationEither)
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
  const routesMeta = {} as Record<RouteUri, Partial<Record<RequestMethod, Contract | null> | undefined>>

  const route = <
    TCallback extends (context: TypedContext<TContract>)=> TContract extends { response: infer Response }
      ? InferResponse<Response>
      : TContract,
    const TContract extends Contract,
  >(
    method: RequestMethod | RequestMethod[],
    exp: RouteUri,
    cb: TCallback,
    contract?: TContract,
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

