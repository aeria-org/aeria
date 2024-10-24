import type { Context, Description, SchemaWithId, InsertPayload, InsertReturnType } from '@aeriajs/types'
import { ObjectId } from 'mongodb'
import { Result, HTTPStatus, ACError, ValidationErrorCode, TraverseError } from '@aeriajs/types'
import { useSecurity, applyWriteMiddlewares } from '@aeriajs/security'
import { endpointErrorSchema } from '@aeriajs/common'
import { traverseDocument } from '../collection/index.js'
import { get } from './get.js'

export type InsertOptions = {
  bypassSecurity?: boolean
}

export const insertErrorSchema = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.UnprocessableContent,
    HTTPStatus.BadRequest,
  ],
  code: [
    ACError.InsecureOperator,
    ACError.OwnershipError,
    ACError.ResourceNotFound,
    ACError.TargetImmutable,
    ACError.MalformedInput,
    ValidationErrorCode.EmptyTarget,
    ValidationErrorCode.InvalidProperties,
    ValidationErrorCode.MissingProperties,
    TraverseError.InvalidDocumentId,
    TraverseError.InvalidTempfile,
  ],
})

const prepareCreate = (doc: Record<string, unknown>, description: Description) => {
  const result: typeof doc = {}
  if( description.defaults ) {
    Object.assign(result, description.defaults)
  }

  Object.assign(result, doc)
  return result
}

const internalInsert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  const isUpdate = !!('_id' in payload.what && payload.what._id)

  const { error, result: what } = await traverseDocument(payload.what, context.description, {
    recurseDeep: true,
    autoCast: true,
    moveFiles: true,
    cleanupReferences: true,
    undefinedToNull: true,
    preserveHidden: true,
    validate: true,
    validateWholeness: isUpdate
      ? 'deep'
      : true,
    fromProperties: !isUpdate,
    context,
  })

  if( error ) {
    if( typeof error === 'string' ) {
      return context.error(HTTPStatus.UnprocessableContent, {
        code: error,
      })
    }

    return context.error(HTTPStatus.UnprocessableContent, {
      code: error.code,
      details: error.errors,
    })
  }

  const docId = '_id' in what && what._id instanceof ObjectId
    ? what._id
    : null

  let newId = docId

  if( !newId ) {
    const content = prepareCreate(what, context.description)
    const now = new Date()
    Object.assign(content, {
      created_at: now,
      updated_at: now,
    })

    newId = (await context.collection.model.insertOne(content)).insertedId

  } else {
    await context.collection.model.updateOne({
      _id: newId,
    }, {
      $set: {
        ...what,
        updated_at: new Date(),
      },
    })
  }

  const inheritedContext: Context = {
    ...context,
    inherited: true,
  }

  const { error: getError, result: newDocument } = await get({
    filters: {
      _id: newId,
    },
  }, inheritedContext, {
    bypassSecurity: true,
  })

  if( getError ) {
    return Result.error(getError)
  }

  return Result.result(newDocument as SchemaWithId<TContext['description']>)
}

export const insert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: InsertOptions = {},
): Promise<InsertReturnType<SchemaWithId<TContext['description']>>> => {
  if( options.bypassSecurity ) {
    return internalInsert(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureWritePayload(payload)
  if( error ) {
    return context.error(HTTPStatus.Forbidden, {
      code: error,
    })
  }

  return applyWriteMiddlewares(securedPayload, context, internalInsert)
}
