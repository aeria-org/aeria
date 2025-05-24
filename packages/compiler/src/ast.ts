import type { Property, AccessCondition, CollectionActions, SearchOptions, DescriptionPreset, Icon, OwnershipMode, Layout, LayoutOptions, FormLayout, Description, FormLayoutField, RequiredProperties } from '@aeriajs/types'
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
  const: 'const',
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

export type LayoutNode = NodeBase<'layout'> & Layout & {
  [LOCATION_SYMBOL]: {
    options: {
      [P in keyof LayoutOptions]?: readonly string[] extends LayoutOptions[P]
        ? symbol | symbol[]
        : symbol
    }
  }
}

export type FormLayoutNode = NodeBase<'formLayout'> & FormLayout<Description> & {
  [LOCATION_SYMBOL]: {
    fields: {
      [P in string]: {
        name: symbol
        field: FormLayoutField<Description>
      }
    }
    terms?: readonly [string, symbol][]
  }
}

export type PropertyNode = NodeBase<'property'> & {
  modifier?: keyof typeof PropertyModifiers
  property: Property & {
    [LOCATION_SYMBOL]?: {
      type: symbol
      attributes: Record<string, symbol>
      arrays: {
        [P in ArrayProperties<Extract<Property, { properties: unknown }>>]?: symbol[]
      }
      contraintTerms?: [string, symbol][]
    }
  }
  nestedProperties?: Record<string, PropertyNode>
  nestedAdditionalProperties?: PropertyNode | boolean
}

export type CollectionNode = NodeBase<'collection'> & {
  name: string
  extends?: ExportSymbol
  middlewares?: readonly string[]
  owned?: OwnershipMode
  icon?: Icon
  actions?: CollectionActions
  individualActions?: CollectionActions
  properties: Record<string, PropertyNode>
  functions?: Record<string, {
    accessCondition: AccessCondition
  }>
  required?: RequiredProperties
  indexes?: readonly string[]
  presets?: DescriptionPreset[]
  form?: readonly string[]
  table?: readonly string[]
  tableMeta?: readonly string[]
  filters?: readonly string[]
  search?: SearchOptions<any>
  layout?: LayoutNode
  formLayout?: FormLayoutNode
  [LOCATION_SYMBOL]: {
    arrays: {
      [P in ArrayProperties<CollectionNode>]?: symbol[]
    }
    required?: symbol[]
    requiredTerms?: readonly [string, symbol][]
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

