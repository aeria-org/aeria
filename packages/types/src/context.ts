import type { Collection as MongoCollection } from 'mongodb'
import type { GenericRequest, GenericResponse } from './http'
import type {
  Either,
  Description,
  PackReferences,
  SchemaWithId,
  FunctionPath,
  Token,
  ApiConfig,
  CollectionDocument,
  CollectionFunctions,
  RateLimitingParams,
  RateLimitingErrors,
} from '.'

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
  functions: infer CollFunctions
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

export type RouteContext<TAcceptedRole = string> = {
  collections: IndepthCollections
  functionPath: FunctionPath
  token: Token<TAcceptedRole>

  request: GenericRequest
  response: GenericResponse

  log: (message: string, details?: any)=> Promise<any>
  limitRate: (params: RateLimitingParams)=> Promise<Either<RateLimitingErrors, {
    hits: number
    points: number
    last_reach: Date
    last_maximum_reach: Date
  }>>

  config: ApiConfig
  inherited: boolean
  calledFunction: string
}

export type Context<TDescription extends Description = any, TFunctions = any> = RouteContext & {
  description: TDescription
  collectionName?: (keyof Collections & string) | string
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{ description: TDescription, functions: TFunctions }>
    : TDescription
}

