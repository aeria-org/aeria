import type { FilterOperators, StrictFilter as Filter, StrictUpdateFilter, WithId, OptionalId, ObjectId } from 'mongodb'
import type { PackReferences, Either, ValidationError, ACErrors } from '.'

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

type DocumentFilter<TDocument> = PackReferences<TDocument> extends infer Document
  ? {
    [P in keyof Document]: null | (
      Document[P] extends ObjectId
        ? Document[P] | string
        : Document[P]
    )
  }
  : never

type RemoveAny<T> = {
  [
  P in keyof T as 0 extends (T[P] & 1)
    ? never
    : P
  ]: T[P]
}

export type StrictFilter<TDocument> = RemoveAny<Filter<DocumentFilter<TDocument>>>

export type StrictFilterOperators<TDocument> = RemoveAny<FilterOperators<DocumentFilter<TDocument>>>

export type Filters<TDocument> = StrictFilter<any> & Partial<{
  [P in keyof TDocument]: null | (
    TDocument[P] extends infer Field
      ? Field extends ObjectId
        ? Field | string
        : Field extends { _id: infer Id }
          ? Id | string
          : Field
      : never
    ) extends infer Field
    ? Field | StrictFilterOperators<Field> | null
    : never
}>

export type What<TDocument> = DocumentFilter<TDocument> extends infer Document
  ? Partial<{
    [P in keyof Document]: Document[P] extends null
      ? null
      : Document[P] | StrictUpdateFilter<Document[P]>
  }> & {
    _id?: ObjectId | string
  }
  : never

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
    : What<TDocument>
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

