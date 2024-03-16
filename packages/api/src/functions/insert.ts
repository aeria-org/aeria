import type { Context, SchemaWithId, InsertPayload } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { left, right, isLeft, unwrapEither, unsafe } from '@aeriajs/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection/index.js'

export type InsertOptions = {
  bypassSecurity?: boolean
}

export const insert = async <
  TContext extends Context,
  TDocument extends Record<string, any> = SchemaWithId<TContext['description']>,
>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options?: InsertOptions,
) => {
  const security = useSecurity(context)

  const query = !options?.bypassSecurity
    ? unsafe(await security.beforeWrite(payload as any))
    : payload

  const whatEither = await traverseDocument(query.what, context.description, {
    recurseDeep: true,
    autoCast: true,
    validate: true,
    validateRequired: payload.what._id
      ? []
      : context.description.required,
    moveFiles: true,
    context,
  })

  if( isLeft(whatEither) ) {
    const error = unwrapEither(whatEither)
    return left(error)
  }

  const what = unwrapEither(whatEither)

  const docId = '_id' in what
    ? what._id
    : null

  const readyWhat = prepareInsert(what, context.description)
  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

  let newId = docId

  if( !newId ) {
    const now = new Date()
    Object.assign(readyWhat, {
      created_at: now,
      updated_at: now,
    })

    newId = (await context.collection.model.insertOne(readyWhat)).insertedId

  } else {
    readyWhat.$set ??= {}
    readyWhat.$set.updated_at = new Date()
    await context.collection.model.updateOne({
      _id: docId,
    }, readyWhat)

  }

  if( context.collection.originalFunctions.get ) {
    const document: TDocument = await context.collection.originalFunctions.get({
      filters: {
        _id: newId,
      },
    }, context, {
      bypassSecurity: true,
    })

    return right(document)
  }

  const document: TDocument = await context.collection.model.findOne({
    _id: newId,
  }, {
    projection,
  })

  const result: TDocument = unsafe(await traverseDocument(document, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
  }))

  return right(result)
}

