import type { FilterOperators, StrictUpdateFilter, WithId, OptionalId, ObjectId } from 'mongodb'
import type {
  PackReferences,
  Either,
  ValidationError,
  ACErrors,
  Context,
  Description,
} from '.'

export type UploadAuxProps = {
  parentId: string
  propertyName: string
}

export type Pagination = {
  recordsCount: number
  recordsTotal: number
  offset: number
  limit: number
}

export type StrictFilterOperators<TDocument> = FilterOperators<TDocument> extends infer InferredFilters
  ? {
    [
      P in keyof InferredFilters as 0 extends (InferredFilters[P] & 1)
        ? never
        : P
    ]: InferredFilters[P]
  }
  : never


export type Filters<TDocument> = Partial<{
  [P in keyof TDocument]: TDocument[P] | StrictFilterOperators<TDocument[P]>
}>

export type What<TDocument> = StrictUpdateFilter<TDocument> & {
  [P in keyof TDocument]?: '_id' extends keyof TDocument[P]
    ? TDocument[P] | string
    : TDocument[P]
}

export type Projection<TDocument> =
  keyof TDocument | '_id' extends infer DocumentProp
    ? TDocument extends string
      ? DocumentProp[]
      : string[]
    : never

export type QuerySort<TDocument> = Partial<Record<keyof WithId<TDocument>, 1 | -1>>

export type CollectionDocument<TDocument> = TDocument

export type CountPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
}

export type GetPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters: Filters<TDocument>
  project?: Projection<TDocument>
  populate?: (keyof TDocument | string)[]
}

export type GetAllPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
  populate?: (keyof TDocument | string)[]
}

export type InsertPayload<TDocument extends CollectionDocument<any>, BypassTypeRestriction = false> = {
  what: BypassTypeRestriction extends true
    ? any
    : What<PackReferences<TDocument>>
  project?: Projection<TDocument>
}

export type RemovePayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters: Filters<TDocument>
}

export type RemoveAllPayload = {
  filters: (string | ObjectId)[]
}

export type RemoveFilePayload = UploadAuxProps & {
  filters: {
    _id: any
  }
}

export type CollectionFunctions<TDocument extends CollectionDocument<OptionalId<any>>> = {
  count: (payload: CountPayload<TDocument>)=> Promise<number>
  get: (payload: GetPayload<TDocument>)=> Promise<TDocument | null>
  getAll: (payload?: GetAllPayload<TDocument>)=> Promise<TDocument[]>
  insert: (payload: InsertPayload<TDocument>)=> Promise<Either<ValidationError | ACErrors, TDocument>>
  remove: (payload: RemovePayload<TDocument>)=> Promise<TDocument>
  removeAll: (payload: RemoveAllPayload)=> Promise<any>
  removeFile: (payload: RemoveFilePayload)=> Promise<any>
}

export type CollectionFunctionsPaginated<TDocument extends CollectionDocument<OptionalId<any>>> = Omit<
  CollectionFunctions<TDocument>,
  | 'getAll'
> & {
  getAll: (payload?: GetAllPayload<TDocument>)=> Promise<{
    data: TDocument[]
    pagination: Pagination
  }>
}

export type CollectionFunctionsWithBypass<TDocument extends CollectionDocument<OptionalId<any>>> = Omit<
  CollectionFunctions<TDocument>,
  | 'insert'
> & {
  insert: (payload: InsertPayload<TDocument, true>)=> Promise<Either<ValidationError | ACErrors, TDocument>>
}

export type CollectionFunctionsWithContext<
  TDocument extends CollectionDocument<OptionalId<any>>,
  TDescription extends Description = any,
  TFunctions = any,
> = {
  [P in keyof CollectionFunctionsWithBypass<TDocument>]: (
    payload: Parameters<CollectionFunctionsWithBypass<TDocument>[P]>[0],
    context: Context<TDescription, TFunctions>
  )=> ReturnType<CollectionFunctions<TDocument>[P]>
}

