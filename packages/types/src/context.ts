import type { Collection as MongoCollection } from 'mongodb'
import type { Collection } from './collection.js'
import type { ApiConfig } from './config.js'
import type { CollectionFunctions } from './functions.js'
import type { Description } from './description.js'
import type { Result } from './result.js'
import type { EndpointError } from './endpointError.js'
import type { GenericRequest, GenericResponse, HTTPStatus } from './http.js'
import type { PackReferences, SchemaWithId } from './schema.js'
import type { JsonSchema } from './property.js'
import type { RateLimitingParams, RateLimitingError } from './security.js'
import type { Token } from './token.js'
import type { AccessCondition } from './accessControl.js'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

type OmitContextParameter<TFunction> = TFunction extends ()=> unknown
  ? TFunction
  : TFunction extends (payload: undefined, ...args: any[])=> infer Return
    ? ()=> Return
    : TFunction extends (payload: infer Payload, context: Context<any>, ...args: infer Rest)=> infer Return
      ? (payload: Payload, ...args: Rest)=> Return
      : never

type RestParameters<TFunction> = TFunction extends (payload: any, context: Context<any>, ...args: infer Rest)=> unknown
  ? Rest
  : never

type UnionFunctions<TFunctions, TSchema extends JsonSchema> = {
  [P in keyof TFunctions]: (
    P extends keyof CollectionFunctions
      ? CollectionFunctions<TSchema>[P] extends infer CollFunction
        ? CollFunction extends (...args: infer Args)=> unknown
          ? Extract<undefined, Args[0]> extends never
            ? (payload: Args[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
            : (payload?: Args[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
          : never
        : never
      : OmitContextParameter<TFunctions[P]>
  ) extends (...args: infer Args)=> infer Return
    ? Return extends Promise<unknown>
      ? (...args: Args)=> Return
      : (...args: Args)=> Promise<Return>
    : never
}

export type IndepthCollection<TCollection> = TCollection extends {
  description: infer InferredDescription
  functions?: infer InferredFunctions
}
  ? InferredDescription extends JsonSchema
    ? Omit<TCollection, 'functions'> & {
      item: SchemaWithId<InferredDescription>
      context: () => Promise<Context<InferredDescription, InferredFunctions>>
      functions: InferredFunctions extends undefined
        ? Record<string, never>
        : UnionFunctions<InferredFunctions, InferredDescription>,
      originalFunctions: InferredFunctions
      model: InferredDescription extends Description
        ? CollectionModel<InferredDescription>
        : never
      middlewares?: Collection['middlewares']
    }
    : never
  : TCollection

export type IndepthCollections = {
  [P in keyof Collections]: IndepthCollection<Collections[P]>
}

export type ContextOptions = {
  config?: ApiConfig
  parentContext?: RouteContext | Context
  collectionName?: Extract<keyof Collections, string>
  token?: Token
  inherited?: boolean
  calledFunction?: string
}

export type RouteContext<TAccessCondition extends AccessCondition = false> = {
  collections: IndepthCollections
  token: Token<TAccessCondition>
  request: GenericRequest
  response: GenericResponse
  log: (message: string, details?: unknown)=> Promise<unknown>
  error: <
    const THTTPStatus extends typeof HTTPStatus[keyof typeof HTTPStatus],
    const TEndpointError extends Omit<EndpointError, 'httpStatus'>,
  >(
    httpStatus: THTTPStatus,
    error: TEndpointError
  )=> Result.Error<TEndpointError & {
    httpStatus: THTTPStatus
  }>

  limitRate: (params: RateLimitingParams)=> Promise<
    Result.Either<
      EndpointError<
        typeof RateLimitingError[keyof typeof RateLimitingError],
        typeof HTTPStatus.TooManyRequests
      >,
      {
        hits: number
        points: number
        last_reach: Date
        last_maximum_reach: Date
      }
    >
  >

  config: ApiConfig
  inherited: boolean
}

export type CollectionContext<
  TDescription extends Description,
  TFunctions = Collection['functions'],
> = {
  description: TDescription
  collectionName?: Extract<keyof Collections, string>
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{
      description: TDescription
      functions: TFunctions
    }>
    : IndepthCollection<any>
  calledFunction?: string
}

export type Context<
  TDescription extends Description = Description,
  TFunctions = Collection['functions'],
> = RouteContext & CollectionContext<TDescription, TFunctions>

export type StrictContext<
  TAccessCondition extends AccessCondition = false,
  TDescription extends Description = any,
  TFunctions = Collection['functions'],
> = RouteContext<TAccessCondition> & CollectionContext<TDescription, TFunctions>

