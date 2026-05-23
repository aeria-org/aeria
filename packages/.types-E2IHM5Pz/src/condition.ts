import type { JsonSchema, PropertiesWithId } from './property.js'

export type FinalOperator =
  | 'equal'
  | 'in'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'

export type FinalCondition<TSchema extends JsonSchema> = {
  operator: FinalOperator
  term1: PropertiesWithId<TSchema>
  term2:
    | string
    | boolean
    | number
    | null
    | readonly unknown[]
    | Condition
  fromState?: boolean
}

export type RegexCondition<TSchema extends JsonSchema> = {
  operator: 'regex'
  term1: PropertiesWithId<TSchema>
  term2: string
  fromState?: boolean
  regexOptions?: string
}

export type TruthyCondition<TSchema extends JsonSchema> = {
  operator: 'truthy'
  term1: PropertiesWithId<TSchema>
}

export type OrCondition<TSchema extends JsonSchema> = {
  or: readonly Condition<TSchema>[]
}

export type AndCondition<TSchema extends JsonSchema> = {
  and: readonly Condition<TSchema>[]
}

export type NotCondition<TSchema extends JsonSchema> = {
  not: Condition<TSchema>
}

export type Condition<TSchema extends JsonSchema = JsonSchema> = (
  | FinalCondition<TSchema>
  | RegexCondition<TSchema>
  | TruthyCondition<TSchema>
  | AndCondition<TSchema>
  | OrCondition<TSchema>
  | NotCondition<TSchema>
) & {
  else?: unknown
}

