import type { Context, SchemaWithId, InsertPayload, InsertReturnType } from '@aeriajs/types'
import { Result, HTTPStatus, ACError, ValidationErrorCode } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { throwIfError, endpointErrorSchema } from '@aeriajs/common'
import { traverseDocument, normalizeProjection, prepareInsert, fill } from '../../collection/index.js'

export type InsertOptions = {
  bypassSecurity?: boolean
}

export const insertErrorSchema = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.UnprocessableContent,
    HTTPStatus.NotFound,
  ],
  code: [
    ACError.InsecureOperator,
    ACError.OwnershipError,
    ACError.ResourceNotFound,
    ACError.TargetImmutable,
    ValidationErrorCode.EmptyTarget,
    ValidationErrorCode.InvalidProperties,
    ValidationErrorCode.MissingProperties,
  ],
})

export const insert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options?: InsertOptions,
): Promise<InsertReturnType<SchemaWithId<TContext['description']>>> => {
  const security = useSecurity(context)

  const query = !options?.bypassSecurity
    ? throwIfError(await security.beforeWrite(payload))
    : payload

  const { error, result: what } = await traverseDocument(query.what, context.description, {
    recurseDeep: true,
    autoCast: true,
    validate: true,
    validateRequired: '_id' in payload.what && payload.what._id
      ? []
      : context.description.required,
    moveFiles: true,
    skipUndefined: true,
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

  const docId = '_id' in what
    ? what._id
    : null

  const content = prepareInsert(what, context.description)

  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

  let newId = docId

  if( !newId ) {
    const now = new Date()
    Object.assign(content, {
      created_at: now,
      updated_at: now,
    })

    newId = (await context.collection.model.insertOne(content)).insertedId

  } else {
    content.$set ??= {}
    content.$set.updated_at = new Date()
    await context.collection.model.updateOne({
      _id: docId,
    }, content)

  }

  let doc: SchemaWithId<any> | null
  if( context.collection.originalFunctions.get ) {
    doc = throwIfError(await context.collection.originalFunctions.get({
      filters: {
        _id: newId,
      },
    }, Object.assign({
      inherited: true,
    }, context), {
      bypassSecurity: true,
    }))
  } else {
    doc = await context.collection.model.findOne({
      _id: newId,
    }, {
      projection,
    })
  }

  if( !doc ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const result = fill(throwIfError(await traverseDocument(doc, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
  })), context.description)

  return Result.result(result)
}

