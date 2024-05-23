import type { RouteContext } from '@aeriajs/types'
import type { functions } from '@aeriajs/core'
import { createContext, getFunction } from '@aeriajs/core'
import { getCollection } from '@aeriajs/entrypoint'
import { next } from '@aeriajs/http'
import { ACErrors, ACErrorMessages } from '@aeriajs/types'
import { isLeft, unwrapEither, pipe } from '@aeriajs/common'
import { appendPagination } from './appendPagination.js'

const postPipe = pipe([appendPagination])

const getACErrorHttpCode = (code: ACErrors) => {
  switch( code ) {
    case ACErrors.FunctionNotFound: return 404
    case ACErrors.FunctionNotExposed: return 403
    case ACErrors.AuthorizationError: return 401
    case ACErrors.AuthenticationError: return 403
    default: return 500
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
        httpCode: error.httpCode,
      },
    }

    if( context.request.headers['sec-fetch-mode'] === 'cors' ) {
      return response
    }

    return context.error({
      httpCode: error.httpCode || 500,
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
    return context.error({
      httpCode: getACErrorHttpCode(code),
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
    return context.error({
      httpCode: getACErrorHttpCode(code),
      code,
      message: ACErrorMessages[code],
    })
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(requestCopy.payload, context)

  return postPipe(result, context)
}

