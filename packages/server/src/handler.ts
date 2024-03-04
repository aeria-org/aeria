import type { Context } from '@aeriajs/types'
import type { functions } from '@aeriajs/api'
import { createContext, getFunction } from '@aeriajs/api'
import { ACErrors } from '@aeriajs/types'
import { isLeft, unwrapEither, pipe } from '@aeriajs/common'
import { appendPagination } from './appendPagination.js'

const postPipe = pipe([appendPagination])

export const safeHandle = (
  fn: (context: Context)=> Promise<object>,
  context: Context,
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

    error.httpCode ??= 500
    context.response.writeHead(error.httpCode, {
      'content-type': 'application/json',
    })

    context.response.end(response)
  }
}

export const customVerbs = () => async (parentContext: Context) => {
  const { fragments: [collectionName, functionName] } = parentContext.request

  const context = await createContext({
    parentContext,
    collectionName,
  })

  const fnEither = await getFunction(
    collectionName,
    functionName,
    context.token.authenticated
      ? context.token
      : {},
  )

  if( isLeft(fnEither) ) {
    const error = unwrapEither(fnEither)
    switch( error ) {
      case ACErrors.ResourceNotFound: throw new Error(`no such collection ${collectionName}`)
      case ACErrors.FunctionNotFound: throw new Error(`no such function ${collectionName}@${functionName}`)
      case ACErrors.AssetNotFound: throw new Error(`collection ${collectionName} has no registered functions`)
      default: throw new Error(`unknown error: ${error}`)
    }
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(context.request.payload, context)

  return postPipe(result, context)
}

export const regularVerb = (functionName: keyof typeof functions) => async (parentContext: Context) => {
  const { fragments: [collectionName, id] } = parentContext.request

  const context = await createContext({
    parentContext,
    collectionName,
  })

  const requestCopy = Object.assign({}, context.request)

  if( id ) {
    requestCopy.payload.filters = {
      ...requestCopy.payload.filters || {},
      _id: id,
    }

    if( 'what' in requestCopy.payload ) {
      requestCopy.payload.what._id = id
    }
  }

  const fnEither = await getFunction(
    collectionName,
    functionName,
    context.token.authenticated
      ? context.token
      : {},
  )

  if( isLeft(fnEither) ) {
    const error = unwrapEither(fnEither)
    return {
      error,
    }
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(requestCopy.payload, context)

  return postPipe(result, context)
}

