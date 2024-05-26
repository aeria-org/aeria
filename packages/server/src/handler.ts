import type { RouteContext } from '@aeriajs/types'
import type { functions } from '@aeriajs/core'
import { createContext, getFunction } from '@aeriajs/core'
import { getCollection } from '@aeriajs/entrypoint'
import { next } from '@aeriajs/http'
import { ACError, ACErrorMessages, HTTPStatus } from '@aeriajs/types'
import { isLeft, unwrapEither, pipe } from '@aeriajs/common'
import { appendPagination } from './appendPagination.js'

const postPipe = pipe([appendPagination])

const getACErrorHttpCode = (code: ACError) => {
  switch( code ) {
    case ACError.FunctionNotFound: return HTTPStatus.NotFound
    case ACError.FunctionNotExposed: return HTTPStatus.Forbidden
    case ACError.AuthorizationError: return HTTPStatus.Unauthorized
    case ACError.AuthenticationError: return HTTPStatus.Forbidden
    default: return HTTPStatus.InternalServerError
  }
}

export const safeHandle = (
  fn: (context: RouteContext)=> Promise<object>,
  context: RouteContext,
) => async () => {
  try {
    const response = await fn(context)
    return response

  } catch(error: any) {
    if( context.config.errorHandler ) {
      return context.config.errorHandler(context, error)
    }

    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(error)
    }

    const response = {
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        details: error.details,
        silent: error.silent,
        logout: error.logout,
        httpStatus: error.httpStatus,
      },
    }

    if( context.request.headers['sec-fetch-mode'] === 'cors' ) {
      return response
    }

    return context.error(error.httpStatus || HTTPStatus.InternalServerError, {
      code: error.code,
      message: error.message,
    })
  }
}

export const customVerbs = () => async (parentContext: RouteContext) => {
  const { fragments: [collectionName, functionName] } = parentContext.request

  const collection = await getCollection(collectionName)
  if( !collection ) {
    return next()
  }

  const context = await createContext({
    parentContext,
    collectionName,
    calledFunction: functionName,
  })

  const fnEither = await getFunction(
    collectionName,
    functionName,
    context.token,
    {
      exposedOnly: true,
    },
  )

  if( isLeft(fnEither) ) {
    const code = unwrapEither(fnEither)
    return context.error(getACErrorHttpCode(code), {
      code,
      message: ACErrorMessages[code],
    })
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(context.request.payload, context)

  return postPipe(result, context)
}

export const regularVerb = (functionName: keyof typeof functions) => async (parentContext: RouteContext) => {
  const { fragments: [collectionName, id] } = parentContext.request

  const collection = await getCollection(collectionName)
  if( !collection ) {
    return next()
  }

  const context = await createContext({
    parentContext,
    collectionName,
    calledFunction: functionName,
  })

  const requestCopy = Object.assign({}, context.request)

  if( id ) {
    requestCopy.payload.filters ??= {}
    requestCopy.payload.filters._id = id

    if( 'what' in requestCopy.payload ) {
      requestCopy.payload.what._id = id
    }
  }

  const fnEither = await getFunction(
    collectionName,
    functionName,
    context.token,
    {
      exposedOnly: true,
    },
  )

  if( isLeft(fnEither) ) {
    const code = unwrapEither(fnEither)
    return context.error(getACErrorHttpCode(code), {
      code,
      message: ACErrorMessages[code],
    })
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(requestCopy.payload, context)

  return postPipe(result, context)
}

