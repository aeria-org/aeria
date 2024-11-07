import type { PhosphorIcon } from '@phosphor-icons/core'
import type { ObjectId } from 'mongodb'
import type { Condition } from './condition.js'
import type { RouteContext } from './context.js'

export type PropertyArrayElement =
  | 'checkbox'
  | 'radio'
  | 'select'

export type PropertyInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'time'
  | 'month'

export type PropertyInputElement =
  | 'input'
  | 'textarea'

export type PropertyFormat =
  | 'date'
  | 'date-time'

export type PropertiesWithId<TSchema extends JsonSchema> =
  Extract<keyof TSchema['properties'], string> | '_id'

export type RequiredProperties<TSchema extends JsonSchema> = readonly PropertiesWithId<TSchema>[] | Partial<Record<
  PropertiesWithId<TSchema>,
  Condition<TSchema> | boolean
>>

export type JsonSchema<TJsonSchema extends JsonSchema = any> = {
  $id: string
  type?: 'object'
  required?: RequiredProperties<TJsonSchema>
  properties: Record<string, Property>
}

export type NonCircularJsonSchema<TJsonSchema extends NonCircularJsonSchema = any> = Omit<JsonSchema<TJsonSchema>, 'properties'> & {
  properties: Record<string, NonCircularProperty>
}

export type RefProperty = {
  $ref: Exclude<keyof Collections, 'file'> & string
  indexes?: readonly string[]
  select?: readonly string[]
  inline?: boolean
  form?: readonly string[]
  purge?: boolean
  populate?: readonly string[]
  populateDepth?: number
  constraints?: Condition
}

export type NonCircularRefProperty = Omit<RefProperty, '$ref'> & {
  $ref: string
}

export type FileProperty = Omit<RefProperty, '$ref'> & {
  $ref: 'file'
  accept?: readonly string[]
  extensions?: readonly string[]
}

export type EnumProperty = {
  enum: readonly unknown[]
  default?: unknown
  element?: PropertyArrayElement
}

export type ArrayProperty<T = unknown> = {
  type: 'array'
  items: T extends Property
    ? T
    : Property
  uniqueItems?: boolean
  minItems?: number
  maxItems?: number
  element?: PropertyArrayElement
}

export type FixedObjectProperty = {
  type: 'object'
  properties: Record<string, Property>
  form?: readonly string[]
  required?: readonly string[]
  writable?: readonly string[]
}

export type VariableObjectProperty =
  | { unstructured: true }
  | { additionalProperties: boolean | Property }

export type ObjectProperty = (FixedObjectProperty | VariableObjectProperty) & {
  type: 'object'
  default?: unknown
}

export type StringProperty = {
  type: 'string'
  minLength?: number
  maxLength?: number
  format?: PropertyFormat
  default?: string | Date
  mask?: string | readonly string[]
  maskedValue?: boolean
  placeholder?: string
  element?: PropertyInputElement
  inputType?: PropertyInputType
}

export type NumberProperty = {
  type:
    | 'number'
    | 'integer'
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  default?: number
  placeholder?: string
}

export type BooleanProperty = {
  type: 'boolean'
  default?: boolean
  element?: 'checkbox'
}

export type GetterProperty = {
  getter: (document: unknown & { _id: ObjectId }, context: RouteContext)=> unknown
  requires?: string[]
}

export type ConstProperty = {
  const: string | number | boolean | undefined | null
}

export type MixedProperty =
  | RefProperty
  | FileProperty
  | EnumProperty
  | ArrayProperty
  | ObjectProperty
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | GetterProperty
  | ConstProperty

export type NonCircularMixedProperty =
  | NonCircularRefProperty
  | FileProperty
  | EnumProperty
  | ArrayProperty
  | ObjectProperty
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | GetterProperty
  | ConstProperty

export type PropertyBase = {
  description?: string
  readOnly?: boolean
  focus?: boolean

  icon?: PhosphorIcon['name']
  translate?: boolean
  hint?: string
  componentProps?: Record<string, unknown>

  noForm?: boolean
  noLabel?: boolean
  hidden?: boolean
  unique?: boolean

  isTimestamp?: boolean
}

export type Property = PropertyBase & MixedProperty

export type NonCircularProperty = PropertyBase & NonCircularMixedProperty

