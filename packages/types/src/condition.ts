import type { JsonSchema, PropertiesWithId } from './property'

export type FinalOperator =
  | 'equal'
  | 'in'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'

export type FinalCondition<TSchema extends JsonSchema = any> = {
  operator: FinalOperator
  term1: PropertiesWithId<TSchema>
  term2: any
  else?: any
}

export type TruthyCondition<TSchema extends JsonSchema = any> = {
  operator: 'truthy'
  term1: PropertiesWithId<TSchema>
}

export type OrCondition<TSchema extends JsonSchema = any> = {
  or: readonly Condition<TSchema>[]
}

export type AndCondition<TSchema extends JsonSchema = any> = {
  and: readonly Condition<TSchema>[]
}

export type NotCondition<TSchema extends JsonSchema = any> = {
  not: Condition<TSchema>
}

export type Condition<TSchema extends JsonSchema = any> =
  | FinalCondition<TSchema>
  | TruthyCondition<TSchema>
  | AndCondition<TSchema>
  | OrCondition<TSchema>
  | NotCondition<TSchema>

