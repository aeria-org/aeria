import type { ObjectId } from 'mongodb'

type Owned = {
  owner?: Collections['user']['item']
}

type Timestamped = {
  updated_at?: Date
  created_at?: Date
}

type CaseOwned<
  TSchema,
  TType,
> = TSchema extends { owned: true | string }
  ? TType & Owned
  : TType

type CaseTimestamped<
  TSchema,
  TType,
> = TSchema extends { timestamps: false }
  ? TType
  : TType & Timestamped

type TestType<T> = T & Record<string, unknown>

export type InferProperty<T> = T extends TestType<{ format: 'date' | 'date-time' }>
  ? Date : T extends TestType<{ enum: ReadonlyArray<infer K> }>
    ? K : T extends TestType<{ type: 'string' }>
      ? string : T extends TestType<{ type: 'number' | 'integer' }>
        ? number : T extends TestType<{ type: 'boolean' }>
          ? boolean : T extends TestType<{ properties: unknown }>
            ? Schema<T & { timestamps: false }> : T extends TestType<{ additionalProperties: infer K }>
              ? { [P: string]: InferProperty<K> | undefined } : T extends TestType<{ type: 'object' }>
                ? any : T extends TestType<{ items: infer K }>
                  ? InferProperty<K>[] : T extends TestType<{ getter: (doc: unknown)=> infer K }>
                    ? Awaited<K> : T extends TestType<{ const: infer K }>
                      ? K : never

export type InferSchema<TSchema> = MergeReferences<TSchema> extends infer MappedTypes
  ? TSchema extends { Required: readonly [] }
    ? Partial<MappedTypes>
    : TSchema extends { required: infer RequiredPropNames }
      ? RequiredPropNames extends readonly (keyof MappedTypes)[]
        ? Pick<MappedTypes, RequiredPropNames[number]> extends infer RequiredProps
          ? RequiredProps & Partial<Exclude<MappedTypes, keyof RequiredProps>>
          : never
        : MappedTypes
      : MappedTypes
  : never

export type Schema<TSchema> = CaseTimestamped<
  TSchema,
  CaseOwned<
    TSchema,
    InferSchema<TSchema>
  >>

export type SchemaWithId<TSchema> = unknown extends TSchema
  ? Record<string, unknown> & {
    _id: ObjectId
  }
  : Schema<TSchema> & {
    _id: ObjectId
  }

export type InferProperties<TSchema> = TSchema extends readonly unknown[]
  ? TSchema extends readonly (infer SchemaOption)[]
    ? SchemaOption extends unknown
      ? SchemaOption extends
        | { $ref: infer K }
        | { items: { $ref: infer K } }
        ? K extends keyof Collections
          ? 'items' extends keyof SchemaOption
            ? Collections[K]['item'][]
            : Collections[K]['item']
          : never
        : InferProperty<SchemaOption>
      : never
    : never
  : InferProperty<TSchema>

export type PackReferences<T> = {
  [P in keyof T]: PackReferencesAux<T[P]>
}

export type FilterReadonlyProperties<TProperties> = {
  [P in keyof TProperties as TProperties[P] extends { readOnly: true }
    ? P
    : never
  ]: InferProperty<TProperties[P]>
}

type MapReferences<TSchema> = TSchema extends { properties: infer Properties }
  ? {
    -readonly [
    P in keyof Properties as Properties[P] extends
        | TestType<{ $ref: string }>
        | TestType<{ items: { $ref: string } }>
      ? P
      : never
    ]: Properties[P] extends infer Prop
      ? Prop extends TestType<{ $ref: infer K }>
        ? K extends keyof Collections
          ? Collections[K]['item']
          : never
        : Prop extends TestType<{ items: TestType<{ $ref: infer K }> }>
          ? K extends keyof Collections
            ? Collections[K]['item'][]
            : never
          : never
      : never
  }
  : never

type PackReferencesAux<T> = T extends (...args: unknown[])=> unknown
  ? T
  : T extends ObjectId
    ? T
    : T extends { _id: infer Id }
      ? Id
      : T extends Record<string, unknown>
        ? PackReferences<T>
        : T extends unknown[] | readonly unknown[]
          ? PackReferencesAux<T[number]>[]
          : T

type CombineProperties<TSchema> = TSchema extends { properties: infer Properties }
  ? FilterReadonlyProperties<Properties> extends infer ReadonlyProperties
    ? Readonly<ReadonlyProperties> & {
      [P in Exclude<keyof Properties, keyof ReadonlyProperties>]: InferProperty<Properties[P]>
    }
    : never
  : never

type MergeReferences<TSchema> = CombineProperties<TSchema> extends infer CombinedProperties
  ? MapReferences<TSchema> extends infer MappedReferences
    ? MappedReferences & Omit<CombinedProperties, keyof MappedReferences>
    : never
  : never

