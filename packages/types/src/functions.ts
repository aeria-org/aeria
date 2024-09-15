import type { FilterOperators, StrictFilter as Filter, WithId, ObjectId } from 'mongodb'
import type { Result } from './result.js'
import type { EndpointError, StrictEndpointError } from './endpointError.js'
import type { PackReferences } from './schema.js'
import type { ACError } from './accessControl.js'
import type { ValidationErrorCode, TraverseError } from './validation.js'
import type { HTTPStatus, WithACErrors } from './http.js'

export type UploadAuxProps = {
  parentId: string
  propName: string
}

export type Pagination = {
  recordsCount: number
  recordsTotal: number
  offset: number
  limit: number
}

type FilterProperty<T> = T extends ObjectId
  ? T | string
  : T

type DocumentFilter<TDocument> = PackReferences<TDocument> extends infer Document
  ? {
    [P in keyof Document]: null | (
      Document[P] extends (infer E)[]
        ? FilterProperty<E>[]
        : FilterProperty<Document[P]>
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

export type Filters<TDocument> = StrictFilter<TDocument> & Partial<{
  [P in keyof TDocument | `${Extract<keyof TDocument, string>}.${string}`]: (
    P extends keyof TDocument
      ? TDocument[P] extends infer Field
        ? Field extends ObjectId
          ? Field | string
          : Field extends { _id: infer Id }
            ? Id | string
            : Field
        : never
      : unknown
  ) extends infer Field
    ? Field | StrictFilterOperators<Field> | null
    : never
}>

export type What<TDocument> = (
  | { _id: ObjectId | string } & Partial<Omit<PackReferences<TDocument>, '_id'>>
  | { _id?: null } & Omit<PackReferences<TDocument>, '_id'>
) extends infer Document
  ? {
    [P in keyof Document]: Document[P] | null
  }
  : never

export type Projection<TDocument> =
  keyof TDocument | '_id' extends infer DocumentProp
    ? [DocumentProp] extends [string]
      ? DocumentProp[]
      : string[]
    : never

export type QuerySort<TDocument> = Partial<Record<keyof WithId<TDocument>, 1 | -1>>

export type CountPayload<TDocument extends WithId<unknown>> = {
  filters?: Filters<TDocument>
}

export type GetPayload<TDocument extends WithId<unknown>> = {
  filters: Filters<TDocument>
  project?: Projection<TDocument>
  populate?: (keyof TDocument)[]
}

export type GetAllPayload<TDocument extends WithId<unknown>> = {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
  populate?: (keyof TDocument)[]
}

export type InsertPayload<TDocument extends WithId<unknown>> = {
  what: What<TDocument>
  project?: Projection<TDocument>
}

export type RemovePayload<TDocument extends WithId<unknown>> = {
  filters: Filters<TDocument>
}

export type RemoveAllPayload = {
  filters: (ObjectId | string)[]
}

export type RemoveFilePayload = UploadAuxProps & {
  filters: {
    _id: ObjectId | string
  }
}

export type InsertReturnType<TDocument> =
  Result.Either<
    StrictEndpointError<
      | ACError.InsecureOperator
      | ACError.OwnershipError
      | ACError.ResourceNotFound
      | ACError.TargetImmutable
      | ValidationErrorCode
      | TraverseError.InvalidDocumentId
      | TraverseError.InvalidTempfile,
      unknown,
      | HTTPStatus.Forbidden
      | HTTPStatus.NotFound
      | HTTPStatus.UnprocessableContent
    >,
    TDocument
  >

export type GetReturnType<TDocument> =
  Result.Either<
    StrictEndpointError<
      | ACError.ResourceNotFound
      | ACError.OwnershipError
      | ACError.MalformedInput,
      unknown,
      | HTTPStatus.Forbidden
      | HTTPStatus.NotFound
      | HTTPStatus.BadRequest
    >,
    TDocument
  >

export type CountReturnType = Result.Either<EndpointError, number>
export type GetAllReturnType<TDocument> = Result.Either<EndpointError, TDocument[]>
export type RemoveReturnType<TDocument> = Result.Either<EndpointError, TDocument>
export type PaginatedGetAllReturnType<TDocument> = Result.Either<EndpointError, {
  data: TDocument[]
  pagination: Pagination
}>

export type CollectionFunctions<TDocument extends WithId<unknown> = WithId<unknown>> = {
  count: (payload: CountPayload<TDocument>)=> Promise<CountReturnType>
  get: (payload: GetPayload<TDocument>)=> Promise<GetReturnType<TDocument>>
  getAll: (payload?: GetAllPayload<TDocument>)=> Promise<GetAllReturnType<TDocument>>
  insert: (payload: InsertPayload<TDocument>)=> Promise<InsertReturnType<TDocument>>
  remove: (payload: RemovePayload<TDocument>)=> Promise<RemoveReturnType<TDocument>>
  // @TODO
  removeAll: (payload: RemoveAllPayload)=> Promise<unknown>
  removeFile: (payload: RemoveFilePayload)=> Promise<unknown>
}

export type CollectionFunctionsSDK<TDocument extends WithId<unknown> = WithId<unknown>> = {
  count: (payload: CountPayload<TDocument>)=> Promise<WithACErrors<CountReturnType>>
  get: (payload: GetPayload<TDocument>)=> Promise<WithACErrors<GetReturnType<TDocument>>>
  getAll: (payload?: GetAllPayload<TDocument>)=> Promise<WithACErrors<PaginatedGetAllReturnType<TDocument>>>
  insert: (payload: InsertPayload<TDocument>)=> Promise<WithACErrors<InsertReturnType<TDocument>>>
  remove: (payload: RemovePayload<TDocument>)=> Promise<WithACErrors<RemoveReturnType<TDocument>>>
  // @TODO
  removeAll: (payload: RemoveAllPayload)=> Promise<unknown>
  removeFile: (payload: RemoveFilePayload)=> Promise<unknown>
}

