import type { Collection as MongoCollection } from 'mongodb'
import type { AcceptedRole } from './token.js'
import type { Collection } from './collection.js'
import type { ApiConfig } from './config.js'
import type { CollectionDocument, CollectionFunctions } from './functions.js'
import type { Description } from './description.js'
import type { Result } from './result.js'
import type { EndpointError } from './endpointError.js'
import type { GenericRequest, GenericResponse, HTTPStatus } from './http.js'
import type { PackReferences, SchemaWithId } from './schema.js'
import type { RateLimitingParams, RateLimitingError } from './security.js'
import type { Token } from './token.js'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

type OmitContextParameter<TFunction> = TFunction extends ()=> unknown
  ? TFunction
  : TFunction extends (payload: undefined, ...args: unknown[])=> infer Return
    ? ()=> Return
    : TFunction extends (payload: infer Payload, context: Context<any>, ...args: infer Rest)=> infer Return
      ? (payload: Payload, ...args: Rest)=> Return
      : never

type RestParameters<TFunction> = TFunction extends (payload: any, context: Context<any>, ...args: infer Rest)=> unknown
  ? Rest
  : never

type UnionFunctions<TFunctions, TSchema extends CollectionDocument<any>> = {
  [P in keyof TFunctions]: (
    P extends keyof CollectionFunctions<any>
      ? CollectionFunctions<TSchema>[P] extends infer CollFunction
        ? CollFunction extends (...args: any[])=> unknown
          ? Extract<undefined, Parameters<CollFunction>[0]> extends never
            ? (payload: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
            : (payload?: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
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
  functions?: infer CollFunctions
}
  ? Omit<TCollection, 'functions'> & {
    functions: UnionFunctions<CollFunctions, SchemaWithId<InferredDescription>>
    originalFunctions: CollFunctions
    model: InferredDescription extends Description
      ? CollectionModel<InferredDescription>
      : never
    item: Collection['item']
    middlewares?: Collection['middlewares']
  }
  : TCollection

export type IndepthCollections = {
  [P in keyof Collections]: IndepthCollection<Collections[P]>
}

export type ContextOptions = {
  config?: ApiConfig
  parentContext?: RouteContext | Context
  collectionName?: string
  token?: Token
  inherited?: boolean
  calledFunction?: string
}

export type RouteContext<TAcceptedRole extends AcceptedRole = null> = {
  collections: IndepthCollections
  token: Token<TAcceptedRole>
  request: GenericRequest
  response: GenericResponse
  log: (message: string, details?: unknown)=> Promise<unknown>
  error: <
    const THTTPStatus extends HTTPStatus,
    const TEndpointError extends EndpointError,
  >(
    httpStatus: THTTPStatus,
    error: TEndpointError
  )=> Result.Error<TEndpointError & {
    httpStatus: THTTPStatus
  }>

  limitRate: (params: RateLimitingParams)=> Promise<
    Result.Either<
      EndpointError<
        RateLimitingError,
        HTTPStatus.TooManyRequests
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
  calledFunction: string
}

export type CollectionContext<
  TDescription extends Description = any,
  TFunctions = Collection['functions'],
> = {
  description: TDescription
  collectionName?: (keyof Collections & string) | string
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{
      description: TDescription
      functions: TFunctions
    }>
    : IndepthCollection<any>
}

export type Context<
  TDescription extends Description = Description,
  TFunctions = Collection['functions'],
> = RouteContext & CollectionContext<TDescription, TFunctions>

export type StrictContext<
  TAcceptedRole extends AcceptedRole = null,
  TDescription extends Description = any,
  TFunctions = Collection['functions'],
> = RouteContext<TAcceptedRole> & CollectionContext<TDescription, TFunctions>

