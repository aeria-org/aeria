import type { RouteContext } from '@aeriajs/types'
import type { functions } from '@aeriajs/core'
import { createContext, getFunction } from '@aeriajs/core'
import { getCollection } from '@aeriajs/entrypoint'
import { ACError, HTTPStatus, Result } from '@aeriajs/types'
import { pipe } from '@aeriajs/common'
import { appendPagination } from './appendPagination.js'

const postPipe = pipe([appendPagination])

const getACErrorHttpCode = (code: typeof ACError[keyof typeof ACError]) => {
  switch( code ) {
    case ACError.FunctionNotFound: return HTTPStatus.NotFound
    case ACError.FunctionNotExposed: return HTTPStatus.Forbidden
    case ACError.AuthorizationError: return HTTPStatus.Unauthorized
    case ACError.InvalidToken: return HTTPStatus.Unauthorized
    case ACError.AuthenticationError: return HTTPStatus.Forbidden
    default: return HTTPStatus.InternalServerError
  }
}

export const safeHandle = (fn: (context: RouteContext)=> Promise<unknown>, context: RouteContext) => async () => {
  try {
    const response = await fn(context)
    return response

  } catch(error) {
    if( context.config.errorHandler ) {
      return context.config.errorHandler(context, error)
    }

    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(error)
    }

    if( context.request.headers['sec-fetch-mode'] === 'cors' ) {
      return Result.error({
        code: ACError.UnknownError,
        message: String(error),
      })
    }

    return context.error(HTTPStatus.InternalServerError, {
      code: ACError.UnknownError,
      message: String(error),
    })
  }
}

export const customVerbs = () => async (parentContext: RouteContext) => {
  const { fragments: [collectionName, functionName] } = parentContext.request

  const collection = await getCollection(collectionName)
  if( !collection ) {
    return
  }

  const context = await createContext({
    collectionName: collectionName as keyof Collections,
    calledFunction: functionName,
    parentContext,
  })

  const { error, result: fn } = await getFunction(collectionName, functionName, context.token, {
    exposedOnly: true,
  })

  if( error ) {
    return context.error(getACErrorHttpCode(error), {
      code: error,
    })
  }

  const result = await fn(context.request.payload, context)
  return postPipe(result, context)
}

export const regularVerb = (functionName: keyof typeof functions) => async (parentContext: RouteContext) => {
  const { fragments: [collectionName, id] } = parentContext.request

  const collection = await getCollection(collectionName)
  if( !collection ) {
    return
  }

  const context = await createContext({
    collectionName: collectionName as keyof Collections,
    calledFunction: functionName,
    parentContext,
  })

  const requestCopy = Object.assign({}, context.request)

  if( id ) {
    requestCopy.payload.filters ??= {}
    if( requestCopy.payload.filters && typeof requestCopy.payload.filters === 'object' ) {
      Object.assign(requestCopy.payload.filters, {
        _id: id,
      })
    }

    if( requestCopy.payload.what && typeof requestCopy.payload.what === 'object' ) {
      Object.assign(requestCopy.payload.what, {
        _id: id,
      })
    }
  }

  const { error, result: fn } = await getFunction(collectionName, functionName, context.token, {
    exposedOnly: true,
  })

  if( error ) {
    return context.error(getACErrorHttpCode(error), {
      code: error,
    })
  }

  const result = await fn(requestCopy.payload, context)
  return postPipe(result, context)
}

