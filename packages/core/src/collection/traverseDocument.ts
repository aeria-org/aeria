import type { Description, Property, ValidationError, Context } from '@aeriajs/types'
import { Result, ACError, ValidationErrorCode, TraverseError } from '@aeriajs/types'
import { throwIfError, pipe, isReference, getValueFromPath, isObjectId, isError } from '@aeriajs/common'
import { makeValidationError, validateProperty, validateWholeness } from '@aeriajs/validation'
import { ObjectId } from 'mongodb'
import { getCollectionAsset } from '../assets.js'
import { preloadDescription } from './preload.js'
import * as fs from 'fs/promises'

export type TraverseOptions = {
  autoCast?: boolean
  getters?: boolean
  validate?: boolean
  validateRequired?: Description['required']
  moveFiles?: boolean
  fromProperties?: boolean
  allowOperators?: boolean
  skipUndefined?: boolean
  recurseDeep?: boolean
  recurseReferences?: boolean
  context?: Context
}

export type TraverseNormalized = {
  description: Description
  pipe: <T = unknown>(value: unknown, phaseContext: PhaseContext)=> T | Promise<T>
}

type PhaseContext = {
  target: any
  root: {
    _id?: ObjectId | string
  }
  propName: string
  propPath: string
  property: Property
  options: TraverseOptions & TraverseNormalized
  isArray?: boolean
}

const getProperty = (propertyName: string, parentProperty: Property | Description) => {
  if( propertyName === '_id' ) {
    return <Property>{
      type: 'string',
    }
  }

  if( 'items' in parentProperty && 'properties' in parentProperty.items && propertyName in parentProperty.items.properties ) {
    return parentProperty.items.properties[propertyName]
  }

  if( 'additionalProperties' in parentProperty ) {
    return parentProperty.additionalProperties
  }

  if( 'properties' in parentProperty ) {
    return parentProperty.properties[propertyName]
  }
}

const disposeOldFiles = async (ctx: PhaseContext, options: { preserveIds?: ObjectId[] } = {}) => {
  if( !options.preserveIds && Array.isArray(ctx.target[ctx.propName]) ) {
    return
  }

  const context = ctx.options.context!

  const doc = await context.collections[ctx.options.description.$id].model.findOne({
    _id: new ObjectId(ctx.root._id),
  }, {
    projection: {
      [ctx.propPath]: 1,
    },
  })

  if( !doc ) {
    return Result.error(TraverseError.InvalidDocumentId)
  }

  let fileIds = getValueFromPath(doc, ctx.propPath)

  if( options.preserveIds ) {
    fileIds = fileIds.filter((id: ObjectId | null) => !id || !options.preserveIds!.some((fromId) => {
      return id.equals(fromId)
    }))
  }

  const fileFilters = {
    _id: {
      $in: Array.isArray(fileIds)
        ? fileIds
        : [fileIds],
    },
  }

  const files = context.collections.file.model.find(fileFilters, {
    projection: {
      absolute_path: 1,
    },
  })

  let file: any
  while( file = await files.next() ) {
    try {
      await fs.unlink(file.absolute_path)
    } catch( err ) {
      console.trace(err)
    }
  }

  return context.collections.file.model.deleteMany(fileFilters)
}

const autoCast = (value: any, ctx: Omit<PhaseContext, 'options'> & { options: (TraverseOptions & TraverseNormalized) | {} }): any => {
  switch( typeof value ) {
    case 'boolean': {
      return !!value
    }

    case 'string': {
      if( isReference(ctx.property) ) {
        return ObjectId.isValid(value)
          ? new ObjectId(value)
          : value
      }

      if( 'format' in ctx.property ) {
        if( ctx.property.format === 'date' || ctx.property.format === 'date-time' ) {
          const timestamp = Date.parse(value)
          return !Number.isNaN(timestamp)
            ? new Date(timestamp)
            : null
        }
      }

      return value
    }

    case 'number': {
      if( 'type' in ctx.property && ctx.property.type === 'integer' ) {
        return parseInt(value.toString())
      }

      if( 'format' in ctx.property ) {
        if( ctx.property.format === 'date' || ctx.property.format === 'date-time' ) {
          return new Date(value)
        }
      }
    }

    case 'object': {
      if( !value || isObjectId(value) ) {
        return value
      }

      if( !('description' in ctx.options) || !ctx.options.recurseDeep ) {
        if( Array.isArray(value) ) {
          return value.map((v) => autoCast(v, ctx))
        }

        if( Object.keys(value).length > 0 ) {
          const entries: [string, unknown][] = []
          for( const [k, v] of Object.entries(value) ) {
            const subProperty = !k.startsWith('$')
              ? getProperty(k, ctx.property)
              : ctx.property

            if( !subProperty ) {
              continue
            }

            entries.push([
              k,
              autoCast(v, {
                ...ctx,
                property: subProperty,
              }),
            ])
          }

          return Object.fromEntries(entries)
        }
      }

    }
  }

  return value
}

const getters = (value: any, ctx: PhaseContext) => {
  if( 'getter' in ctx.property ) {
    return ctx.property.getter(ctx.target)
  }

  return value
}

const validate = (value: any, ctx: PhaseContext) => {
  if( ctx.options.recurseDeep ) {
    if( 'items' in ctx.property || 'properties' in ctx.property ) {
      return value
    }
  }

  const { error } = validateProperty(ctx.propName, value, ctx.property)

  if( error ) {
    return Result.error({
      [ctx.propName]: error,
    })
  }

  return value
}

const moveFiles = async (
  value:
    | undefined
    | ObjectId
    | {
      tempId: string
    },
  ctx: PhaseContext,
) => {
  if( !('$ref' in ctx.property) || ctx.property.$ref !== 'file' || value instanceof ObjectId ) {
    return value
  }

  if( !ctx.options.context ) {
    throw new Error()
  }

  if( !value ) {
    if( ctx.root._id && !ctx.isArray ) {
      await disposeOldFiles(ctx)
    }
    return null
  }

  const tempFile = await ctx.options.context.collections.tempFile.model.findOne({
    _id: new ObjectId(value.tempId),
  })

  if( !tempFile ) {
    return Result.error(TraverseError.InvalidTempfile)
  }

  if( ctx.root._id && !ctx.isArray ) {
    await disposeOldFiles(ctx)
  }

  const { _id: fileId, ...newFile } = tempFile
  newFile.absolute_path = `${ctx.options.context.config.storage!.fs}/${tempFile.absolute_path.replace(/\\/g, '/').split('/').pop()}`
  await fs.rename(tempFile.absolute_path, newFile.absolute_path)

  const file = await ctx.options.context.collections.file.model.insertOne(newFile)
  return file.insertedId
}

const recurseDeep = async (value: any, ctx: PhaseContext) => {
  if( !value ) {
    return value
  }

  if( 'properties' in ctx.property ) {
    const { error, result } = await recurse(value, ctx)
    if( error ) {
      return Result.error(error)
    }

    return result
  }

  if( 'items' in ctx.property ) {
    if( !Array.isArray(value) ) {
      return value
    }

    const items: ObjectId[] = []
    for( const item of value ) {
      const result = await ctx.options.pipe<ObjectId>(item, {
        ...ctx,
        property: ctx.property.items,
        isArray: true,
      })

      items.push(result)
    }

    if( ctx.options.moveFiles && '$ref' in ctx.property.items && ctx.property.items.$ref === 'file' ) {
      await disposeOldFiles(ctx, {
        preserveIds: items,
      })
    }

    return items
  }

  return value
}

const recurse = async <TRecursionTarget extends Record<string, any>>(
  target: TRecursionTarget,
  ctx: Pick<
    PhaseContext,
      | 'root'
      | 'options'
      | 'property'
      | 'propPath'
  >,

): Promise<Result.Either<
  | ValidationError
  | TraverseError
  | ACError.InsecureOperator,
  TRecursionTarget
>> => {
  const entries = []
  const entrypoint = ctx.options.fromProperties && 'properties' in ctx.property
    ? {
      _id: null,
      ...ctx.property.properties,
    }
    : target

  for( const propName in entrypoint ) {
    const value = target[propName]
    const property = getProperty(propName, ctx.property)

    if( ctx.options.skipUndefined ) {
      if( value === undefined && !(ctx.options.getters && property && 'getter' in property) ) {
        continue
      }
    }

    if( ctx.options.autoCast && propName === '_id' ) {
      entries.push([
        propName,
        autoCast(value, {
          ...ctx,
          target,
          propName,
          property: {
            $ref: '',
          },
        }),
      ])

      continue
    }

    if( !property ) {
      if( value && (value.constructor === Object || value.constructor === Array) ) {
        // if first propName is preceded by '$' we assume
        // it contains MongoDB query operators
        if( Object.keys(value)[0]?.startsWith('$') ) {
          if( !ctx.options.allowOperators ) {
            return Result.error(ACError.InsecureOperator)
          }

          entries.push([
            propName,
            value,
          ])
          continue
        }

        if( Array.isArray(value) ) {
          const operations = []
          for( const operation of value ) {
            const { error, result } = await recurse(operation, ctx)
            if( error ) {
              return Result.error(error)
            }

            operations.push(result)
          }

          entries.push([
            propName,
            operations,
          ])
          continue
        }

        const { error, result: operator } = await recurse(value, ctx)
        if( error ) {
          return Result.error(error)
        }

        entries.push([
          propName,
          operator,
        ])
        continue
      }

      entries.push([
        propName,
        value,
      ])
    }

    if( property ) {
      if( ctx.options.recurseReferences ) {
        const propCast = 'items' in property
          ? property.items
          : property

        if( '$ref' in propCast && value && !(value instanceof ObjectId) ) {
          const targetDescription = await preloadDescription(throwIfError(await getCollectionAsset(propCast.$ref, 'description')))

          if( Array.isArray(value) ) {
            const documents = []

            for( const elem of value ) {
              if( elem instanceof ObjectId ) {
                documents.push(elem)
                continue
              }

              const { error, result } = await traverseDocument(elem, targetDescription, ctx.options)
              if( error ) {
                return Result.error(error)
              }

              documents.push(result)
            }

            entries.push([
              propName,
              documents,
            ])
            continue
          }

          const { error, result: document } = await traverseDocument(value, targetDescription, ctx.options)
          if( error ) {
            return Result.error(error)
          }

          entries.push([
            propName,
            document,
          ])
          continue
        }
      }

      entries.push([
        propName,
        await ctx.options.pipe(value, {
          ...ctx,
          target,
          propName,
          propPath: ctx.propPath
            ? `${ctx.propPath}.${propName}`
            : propName,
          property,
        }),
      ])
    }
  }

  return Result.result(Object.fromEntries(entries))
}

export const traverseDocument = async <const TWhat extends Record<string, unknown>>(
  what: TWhat,
  description: Description,
  _options: TraverseOptions,
) => {
  const options = Object.assign({}, _options) as TraverseOptions & TraverseNormalized
  const functions = []

  if( !options.validate && Object.keys(what).length === 0 ) {
    return Result.result({})
  }

  if( options.recurseDeep ) {
    functions.push(recurseDeep)
  }

  if( options.autoCast ) {
    functions.push(autoCast)
  }

  if( options.getters ) {
    functions.push(getters)
  }

  if( options.validate ) {
    const descriptionCopy = Object.assign({}, description)
    if( options.validateRequired ) {
      descriptionCopy.required = options.validateRequired
    }

    const wholenessError = validateWholeness(what, descriptionCopy)
    if( wholenessError ) {
      return Result.error(wholenessError)
    }

    functions.push(validate)
  }

  if( options.moveFiles ) {
    functions.push(moveFiles)
  }

  let traverseError: TraverseError | undefined
  let validationError: Record<string, ValidationError> | undefined

  const mutateTarget = (fn: (value: any, ctx: PhaseContext)=> unknown) => {
    return async (value: unknown, ctx: PhaseContext) => {
      const result = await fn(value, ctx)
      if( ctx.target && typeof ctx.target === 'object' ) {
        ctx.target[ctx.propName] = result
      }
      return result
    }
  }

  options.description = description

  Object.assign(options, {
    pipe: pipe(functions.map(mutateTarget), {
      returnFirst: (value) => {
        if( isError(value) ) {
          const error = value.error as TraverseError | Record<string, ValidationError>
          switch( error ) {
            case TraverseError.InvalidDocumentId:
            case TraverseError.InvalidTempfile:
              traverseError = error
              break
            default:
              validationError = error
          }

          return value
        }
      },
    }),
  })

  const { error, result } = await recurse(what, {
    root: what,
    property: description as Property,
    propPath: '',
    options,
  })

  if( error ) {
    return Result.error(error)
  }

  if( traverseError ) {
    return Result.error(traverseError)
  }

  if( validationError ) {
    return Result.error(makeValidationError({
      code: ValidationErrorCode.InvalidProperties,
      errors: validationError,
    }))
  }

  return Result.result(result as any)
}

