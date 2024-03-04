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

type TestType<T> = T & Record<string, any>

export type InferProperty<T> = T extends TestType<{ format: 'date' | 'date-time' }>
  ? Date : T extends TestType<{ enum: ReadonlyArray<infer K> }>
    ? K : T extends TestType<{ type: 'string' }>
      ? string : T extends TestType<{ type: 'number' }>
        ? number : T extends TestType<{ type: 'boolean' }>
          ? boolean : T extends TestType<{ properties: any }>
            ? Schema<T & { timestamps: false }> : T extends TestType<{ type: 'object' }>
              ? any : T extends TestType<{ literal: infer K }>
                ? K : T extends TestType<{ items: infer K }>
                  ? InferProperty<K>[] : T extends TestType<{ getter: (doc: any)=> infer K }>
                    ? K : never

export type InferSchema<TSchema> = MergeReferences<TSchema> extends infer MappedTypes
  ? TSchema extends { required: readonly [] }
    ? Partial<MappedTypes>
    : TSchema extends { required: infer RequiredPropNames }
      ? RequiredPropNames extends readonly (keyof MappedTypes)[]
        ? Pick<MappedTypes, RequiredPropNames[number]> extends infer RequiredProps
          ? RequiredProps & Partial<Exclude<MappedTypes, keyof RequiredProps>>
          : never
        : never
      : MappedTypes
  : never

export type Schema<TSchema> = CaseTimestamped<
  TSchema,
  CaseOwned<
    TSchema,
    InferSchema<TSchema>
  >>

export type SchemaWithId<TSchema> = Schema<TSchema> & {
  _id: ObjectId
}

export type MapSchemaUnion<TSchema> = TSchema extends readonly (infer SchemaOption)[]
  ? SchemaOption extends any
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
  : InferProperty<TSchema>

export type ObjectToSchema<TObject, TRequired extends string[] | null = null> = TObject extends readonly [infer K]
  ? ValueToProperty<[K]>
  : keyof TObject extends never
    ? { type: 'object' }
    : {
      [P in keyof TObject]: TObject[P] extends infer Value
        ? ValueToProperty<Value>
        : never
    } extends infer Properties
      ? TRequired extends null
        ? { type: 'object', properties: Properties }
        : { type: 'object', required: TRequired, properties: Properties }
      : never

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

type PackReferencesAux<T> = T extends (...args: any[])=> any
  ? T
  : T extends { _id: infer Id }
    ? Id
    : T extends Record<string, any>
      ? PackReferences<T>
      : T extends any[] | readonly any[]
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

type ValueToProperty<TValue> = TValue extends `$${infer Ref}`
  ? { $ref: Ref } : TValue extends string
    ? { type: 'string' } : TValue extends number
      ? { type: 'number' } : TValue extends boolean
        ? { type: 'boolean' } : TValue extends new ()=> Date
          ? { type: 'string', format: 'date' } : TValue extends readonly [infer K]
            ? { type: 'array', items: ValueToProperty<K> } : TValue extends (infer K)[]
              ? { enum: K } : TValue extends Record<string, any>
                ? keyof TValue extends never
                  ? { type: 'object' }
                  : { type: 'object' } & ObjectToSchema<TValue> : never

