import type { Property, AccessCondition, CollectionActions, Description } from '@aeriajs/types'

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

export type PropertyNode = {
  type: 'property'
  modifier?: keyof typeof PropertyModifiers
  property: Property
  nestedProperties?: Record<string, PropertyNode>
}

export type CollectionNode = {
  type: 'collection'
  name: string
  extends?: ExportSymbol
  owned?: boolean
  actions?: CollectionActions
  individualActions?: CollectionActions
  properties: Record<string, PropertyNode>
  functions?: Record<string, {
    accessCondition: AccessCondition,
    fromFunctionSet?: true
  }>
}

export type ContractNode = {
  type: 'contract'
  name: string
  roles?: AccessCondition
  query?:
    | PropertyNode
    | PropertyNode[]
  payload?:
    | PropertyNode
    | PropertyNode[]
  response?:
    | PropertyNode
    | PropertyNode[]
}

export type FunctionSetNode = {
  type: 'functionset'
  name: string
  functions: Record<string, {
    accessCondition: AccessCondition,
    fromFunctionSet?: true
  }>
}

export type Node =
  | CollectionNode
  | ContractNode
  | FunctionSetNode

export type NodeType = Node['type']

export const findNode = <TNodeType extends NodeType>(
  nodes: Node[],
  { type, name }: {
    type: TNodeType,
    name: string
  },
) => {
  return nodes.find((node) => {
    return node.type === type && node.name === name
  }) as Extract<Node, { type: TNodeType }> | undefined
}

