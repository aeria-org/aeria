import type { PhosphorIcon } from '@phosphor-icons/core'
import type { ObjectId } from 'mongodb'
import type { Condition } from './condition.js'
import type { RouteContext } from './context.js'

export const PROPERTY_ARRAY_ELEMENTS = [
  'checkbox',
  'radio',
  'select',
] as const

export const PROPERTY_INPUT_TYPES = [
  'text',
  'email',
  'password',
  'search',
  'time',
  'month',
] as const

export const PROPERTY_INPUT_ELEMENTS = [
  'input',
  'textarea',
] as const

export const PROPERTY_FORMATS = [
  'date',
  'date-time',
  'objectid',
] as const

export type PropertyArrayElement = typeof PROPERTY_ARRAY_ELEMENTS[number]
export type PropertyInputType = typeof PROPERTY_INPUT_TYPES[number]
export type PropertyInputElement = typeof PROPERTY_INPUT_ELEMENTS[number]
export type PropertyFormat = typeof PROPERTY_FORMATS[number]

export type PropertiesWithId<TJsonSchema extends JsonSchema> =
  Extract<keyof TJsonSchema['properties'], string> | '_id'

export type RequiredProperties<TJsonSchema extends JsonSchema = JsonSchema> = readonly PropertiesWithId<TJsonSchema>[] | Partial<Record<
  PropertiesWithId<TJsonSchema>,
  Condition<TJsonSchema> | boolean
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
  populate?: readonly string[]
  form?: readonly string[]
  inline?: boolean
  purge?: boolean
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
  | { additionalProperties: true | Property }

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
  inputType?: PropertyInputType
  element?: PropertyInputElement
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
  type: 'getter'
  getter?: (document: unknown & { _id: ObjectId }, context: RouteContext)=> unknown
  requires?: string[]
}

export type ConstProperty = {
  const: string | number | boolean | null
}

export type ConstUndefinedProperty = {
  const?: undefined
  isConstUndefined: true
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
  | ConstUndefinedProperty

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
  | ConstUndefinedProperty

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

  isTimestamp?: boolean
  validationMessage?: string
}

export type Property = PropertyBase & MixedProperty

export type NonCircularProperty = PropertyBase & NonCircularMixedProperty

