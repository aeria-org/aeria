import type { Collection as MongoCollection } from 'mongodb'
import type { AcceptedRole } from './token.js'
import type { ApiConfig } from './config.js'
import type { CollectionDocument, CollectionFunctions } from './functions.js'
import type { Description } from './description.js'
import type { EndpointError, EndpointErrorContent } from './error.js'
import type { GenericRequest, GenericResponse, HTTPStatus } from './http.js'
import type { PackReferences, SchemaWithId } from './schema.js'
import type { RateLimitingParams, RateLimitingError } from './security.js'
import type { Token } from './token.js'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

type OmitContextParameter<TFunction> = TFunction extends ()=> any
  ? TFunction
  : TFunction extends (payload: undefined, ...args: any[])=> infer Return
    ? ()=> Return
    : TFunction extends (payload: infer Payload, context: Context, ...args: infer Rest)=> infer Return
      ? (payload: Payload, ...args: Rest)=> Return
      : never

type RestParameters<TFunction> = TFunction extends (payload: any, context: Context, ...args: infer Rest)=> any
  ? Rest
  : never

type UnionFunctions<TFunctions, TSchema extends CollectionDocument<any>> = {
  [P in keyof TFunctions]: (
    P extends keyof CollectionFunctions<any>
      ? CollectionFunctions<TSchema>[P] extends infer CollFunction
        ? CollFunction extends (...args: any[])=> any
          ? Extract<undefined, Parameters<CollFunction>[0]> extends never
            ? (payload: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
            : (payload?: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
          : never
        : never
      : OmitContextParameter<TFunctions[P]>
  ) extends (...args: infer Args)=> infer Return
    ? Return extends Promise<any>
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

  log: (message: string, details?: any)=> Promise<any>

  error: <
    const THTTPStatus extends HTTPStatus,
    const TEndpointErrorContent extends EndpointErrorContent,
  >(
    httpStatus: THTTPStatus,
    error: TEndpointErrorContent
  )=> EndpointError<TEndpointErrorContent & {
    httpStatus: THTTPStatus
  }>

  limitRate: (params: RateLimitingParams)=> Promise<
    | EndpointError<
      EndpointErrorContent<
        RateLimitingError,
        HTTPStatus.TooManyRequests
      >
    >
    | {
      hits: number
      points: number
      last_reach: Date
      last_maximum_reach: Date
    }
  >

  config: ApiConfig
  inherited: boolean
  calledFunction: string
}

export type CollectionContext<
  TDescription extends Description = any,
  TFunctions = any,
> = {
  description: TDescription
  collectionName?: (keyof Collections & string) | string
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{ description: TDescription, functions: TFunctions }>
    : IndepthCollection<any>
}

export type Context<
  TDescription extends Description = Description,
  TFunctions = any,
> = RouteContext & CollectionContext<TDescription, TFunctions>

export type StrictContext<
  TAcceptedRole extends AcceptedRole = null,
  TDescription extends Description = any,
  TFunctions = any,
> = RouteContext<TAcceptedRole> & CollectionContext<TDescription, TFunctions>

