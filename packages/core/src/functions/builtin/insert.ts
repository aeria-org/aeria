import type { Context, SchemaWithId, InsertPayload } from '@aeriajs/types'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { left, right, isLeft, unwrapEither, unsafe } from '@aeriajs/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../../collection/index.js'

export type InsertOptions = {
  bypassSecurity?: boolean
}

export const insert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options?: InsertOptions,
) => {
  const security = useSecurity(context)

  const query = !options?.bypassSecurity
    ? unsafe(await security.beforeWrite(payload))
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

  let doc: SchemaWithId<TContext['description']> | null
  if( context.collection.originalFunctions.get ) {
    doc = await context.collection.originalFunctions.get({
      filters: {
        _id: newId,
      },
    }, Object.assign({
      inherited: true,
    }, context), {
      bypassSecurity: true,
    })
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

  const result = unsafe(await traverseDocument(doc, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
  }))

  return right(result)
}

