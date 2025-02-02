import type { Property, AccessCondition, CollectionActions, SearchOptions, DescriptionPreset } from '@aeriajs/types'
import type { ArrayProperties } from './utils.js'

export const LOCATION_SYMBOL = Symbol()

export const PropertyType = {
  str: 'string',
  int: 'integer',
  num: 'number',
  bool: 'boolean',
  enum: 'enum',
  date: 'string',
  datetime: 'string',
} as const

export const PropertyModifiers: Record<'Error' | 'Result', ExportSymbol> = {
  Error: {
    packageName: 'aeria',
    symbolName: 'errorSchema',
  },
  Result: {
    packageName: 'aeria',
    symbolName: 'resultSchema',
  },
}

export type ExportSymbol = {
  packageName: string
  symbolName: string
}

export type NodeBase<TType> = {
  kind: TType
}

export type PropertyNode = NodeBase<'property'> & {
  modifier?: keyof typeof PropertyModifiers
  property: Property & {
    [LOCATION_SYMBOL]?: {
      attributes: Record<string, symbol>
      arrays: {
        [P in ArrayProperties<Extract<Property, { properties: unknown }>>]?: symbol[]
      }
    }
  }
  nestedProperties?: Record<string, PropertyNode>
}

export type CollectionNode = NodeBase<'collection'> & {
  name: string
  extends?: ExportSymbol
  owned?: 'on-write' | 'always'
  icon?: string
  actions?: CollectionActions
  individualActions?: CollectionActions
  properties: Record<string, PropertyNode>
  functions?: Record<string, {
    accessCondition: AccessCondition
  }>
  required?: Record<string, unknown> | string[]
  indexes?: string[]
  presets?: DescriptionPreset[]
  form?: string[]
  table?: string[]
  filters?: string[]
  search?: SearchOptions
  [LOCATION_SYMBOL]: {
    arrays: {
      [P in ArrayProperties<CollectionNode>]?: symbol[]
    }
  }
}

export type ContractNode = NodeBase<'contract'> & {
  name: string
  roles?: AccessCondition
  query?: PropertyNode
  payload?: PropertyNode
  response?:
    | PropertyNode
    | PropertyNode[]
}

export type FunctionSetNode = NodeBase<'functionset'> & {
  name: string
  functions: Record<string, {
    accessCondition: AccessCondition,
    fromFunctionSet?: true
  }>
}

export type ProgramNode = NodeBase<'program'> & {
  collections: CollectionNode[]
  contracts: ContractNode[]
  functionsets: FunctionSetNode[]
}

export type Node =
  | CollectionNode
  | ContractNode
  | FunctionSetNode

export type NoteKind = Node['kind']

