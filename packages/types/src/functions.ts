import type { FilterOperators, UpdateFilter, WithId, OptionalId, ObjectId } from 'mongodb'
import type { PackReferences, Either, ValidationError } from '.'

export type UploadAuxProps = {
  parentId: string
  propertyName: string
}

export type Filters<TDocument> = FilterOperators<TDocument>

export type What<TDocument> = Omit<UpdateFilter<TDocument>, keyof TDocument> & {
  [P in keyof TDocument]?: '_id' extends keyof TDocument[P]
    ? TDocument[P] | string
    : TDocument[P]
}

export type Projection<TDocument extends Record<string, any>> =
  keyof TDocument | '_id' extends infer DocumentProp
    ? TDocument extends string
      ? DocumentProp[]
      : string[]
    : never

export type QuerySort<TDocument> = Partial<Record<keyof WithId<TDocument>, 1 | -1>>

export type CollectionDocument<TDocument> = Pick<
  TDocument,
  Extract<keyof TDocument, string>
>

export type CountPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
}

export type GetPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters: Filters<TDocument>
  project?: Projection<TDocument>
  populate?: (keyof TDocument & string)[]
}

export type GetAllPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
  populate?: (keyof TDocument & string)[]
}

export type InsertPayload<TDocument extends CollectionDocument<any>> = {
  what: What<PackReferences<TDocument> & { _id?: any }>
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
  insert: (payload: InsertPayload<TDocument>)=> Promise<Either<ValidationError, TDocument>>
  remove: (payload: RemovePayload<TDocument>)=> Promise<TDocument>
  removeAll: (payload: RemoveAllPayload)=> Promise<any>
  removeFile: (payload: RemoveFilePayload)=> Promise<any>
}

