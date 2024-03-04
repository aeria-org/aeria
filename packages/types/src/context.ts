import type { Collection as MongoCollection } from 'mongodb'
import type { GenericRequest, GenericResponse } from './http'
import type {
  Description,
  PackReferences,
  SchemaWithId,
  FunctionPath,
  DecodedToken,
  ApiConfig,
  CollectionDocument,
  CollectionFunctions,
} from '.'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

type OmitContextParameter<TFunction> = TFunction extends (payload: infer Payload, context: Context, ...args: infer Rest)=> infer Return
  ? (payload: Payload, ...args: Rest)=> Return
  : never

type RestParameters<TFunction> = TFunction extends (payload: any, context: Context, ...args: infer Rest)=> any
  ? Rest
  : never

type UnionFunctions<TFunctions, TSchema extends CollectionDocument<any>> = {
  [P in keyof TFunctions]: P extends keyof CollectionFunctions<any>
    ? CollectionFunctions<TSchema>[P] extends infer CollFunction
      ? CollFunction extends (...args: any[])=> any
        ? Extract<undefined, Parameters<CollFunction>[0]> extends never
          ? (payload: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
          : (payload?: Parameters<CollFunction>[0], ...args: RestParameters<TFunctions[P]>)=> ReturnType<CollFunction>
        : never
      : never
    : OmitContextParameter<TFunctions[P]>
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

export type ContextOptions<TContext> = {
  config?: ApiConfig
  parentContext?: TContext
  collectionName?: string
  token?: DecodedToken
}

export type Context<TDescription extends Description = any, TFunctions = any> = {
  description: TDescription
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{ description: TDescription, functions: TFunctions }>
    : TDescription

  collections: IndepthCollections

  functionPath: FunctionPath
  token: DecodedToken

  collectionName?: (keyof Collections & string) | string
  request: GenericRequest
  response: GenericResponse

  log: (message: string, details?: any)=> Promise<any>
  config: ApiConfig
}

