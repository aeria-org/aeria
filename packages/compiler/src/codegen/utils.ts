import type * as AST from '../ast.js'
import type { Property } from '@aeriajs/types'

export const PACKAGE_NAME = 'aeria'
export const MIDDLEWARES_RUNTIME_PATH = '../../../dist/middlewares/index.js'

export const UnquotedSymbol = Symbol('unquoted')
export const ArraySymbol = Symbol('array')

export type StringifyProperty = unknown | {
  [UnquotedSymbol]: string
}

export const getExposedFunctions = (astFunctions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.fromEntries(Object.entries(astFunctions).map(([key, value]) => [
    key,
    value.accessCondition,
  ]))
}

export const makeASTImports = (ast: AST.Node[], initialImports: Record<string, Set<string>> = {}, options = {
  includeRuntimeOnlyImports: false,
}) => {
  const modifiedSymbols: Record<string, string> = {}

  const toImport = ast.reduce((imports, node) => {
    if (node.kind === 'collection') {
      if (node.extends) {
        const modifiedSymbol = `${node.extends.packageName}${resizeFirstChar(node.extends.symbolName, true)}`
        modifiedSymbols[node.extends.symbolName] = modifiedSymbol

        imports[node.extends.importPath] ??= new Set()
        imports[node.extends.importPath].add(`${node.extends.symbolName} as ${modifiedSymbol}`)
      }

      if (node.functions) {
        for( const functionNode of node.functions ) {
          if( functionNode.exportSymbol ) {
            const { importPath, symbolName } = functionNode.exportSymbol
            imports[importPath] ??= new Set()
            imports[importPath].add(symbolName)
          }
        }
      }

      if( options.includeRuntimeOnlyImports ) {
        if( node.middlewares ) {
          imports[MIDDLEWARES_RUNTIME_PATH] ??= new Set()
          for( const middleware of node.middlewares ) {
            imports[MIDDLEWARES_RUNTIME_PATH].add(middleware)
          }
        }
      }

    }

    return imports
  }, initialImports)

  return {
    code: Object.keys(toImport).map((key) => `import { ${Array.from(toImport[key]).join(', ')} } from '${key}'`),
    modifiedSymbols,
  }
}

export const unwrapNode = <TNode extends { kind: string }>(node: TNode) => {
  const { kind, ...unwrappedNode } = Object.fromEntries(Object.entries(node).filter(([key]) => typeof key === 'string'))
  return unwrappedNode as Omit<TNode, 'kind' | symbol>
}

export const unwrapPropertyNode = ({ property, nestedProperties, nestedAdditionalProperties }: Pick<AST.PropertyNode, 'property' | 'nestedProperties' | 'nestedAdditionalProperties'>): Property => {
  const propertyOrPropertyItems = 'items' in property
    ? property.items
    : property

  let unwrappedProperty = propertyOrPropertyItems

  if ('$ref' in propertyOrPropertyItems) {
    unwrappedProperty = {
      ...propertyOrPropertyItems,
      $ref: getCollectionId(propertyOrPropertyItems.$ref),
    }
  } else if( 'type' in propertyOrPropertyItems && propertyOrPropertyItems.type === 'object' ) {
    let properties: Extract<Property, { properties: unknown }>['properties'] | undefined
    let additionalProperties: Extract<Property, { additionalProperties: unknown }>['additionalProperties'] | undefined

    if( nestedProperties ) {
      properties = recursivelyUnwrapPropertyNodes(nestedProperties)
    }

    if( nestedAdditionalProperties ) {
      additionalProperties = typeof nestedAdditionalProperties === 'boolean'
        ? nestedAdditionalProperties
        : unwrapPropertyNode(nestedAdditionalProperties)
    }

    if( properties && additionalProperties ) {
      unwrappedProperty = {
        ...propertyOrPropertyItems,
        properties,
        additionalProperties,
      }
    } else if( properties ) {
      unwrappedProperty = {
        ...propertyOrPropertyItems,
        properties,
      }
    } else if( additionalProperties ) {
      unwrappedProperty = {
        ...propertyOrPropertyItems,
        additionalProperties,
      }
    }
  }

  if( 'items' in property ) {
    return {
      ...property,
      items: unwrappedProperty,
    }
  }

  return unwrappedProperty
}

export const recursivelyUnwrapPropertyNodes = <
  TProperties extends Record<string, AST.PropertyNode | AST.PropertyNode[]>,
  TReturnType = TProperties[keyof TProperties] extends Array<unknown> ? Record<string, Property[]> : Record<string, Property>,
>
(properties: TProperties): TReturnType => {
  return Object.entries(properties).reduce<Record<string, Property | Property[]>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((propertyNode) => unwrapPropertyNode(propertyNode))
    } else {
      acc[key] = unwrapPropertyNode(value)
    }
    return acc
  }, {}) as TReturnType
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!(value && typeof value === 'object')
}

export const stringify = (value: StringifyProperty, parents: (symbol | string)[] = []): string => {
  if (Array.isArray(value)) {
    let arrayString = '[\n'

    value.map((element: StringifyProperty) => {
      const currentParents = [
        ...parents,
        ArraySymbol,
      ]

      arrayString += '\t'.repeat(currentParents.length) +
        checkQuotes(currentParents, element) + ',\n'
    })

    return arrayString + `${'\t'.repeat(parents.length)}]`
  }

  if (!isRecord(value)) {
    return typeof value === 'number' || typeof value === 'boolean' || !value
      ? String(value)
      : `"${String(value)}"`
  }

  const objectString = Object.keys(value).map((key) => {
    const currentParents = [
      ...parents,
      key,
    ]

    const prefix = '\t'.repeat(currentParents.length)

    return `${prefix}${key}: ${checkQuotes(currentParents, value[key])}`
  }).join(',\n')

  return `{\n${objectString}\n${'\t'.repeat(parents.length)}}`
}

const checkQuotes = (parents: (symbol | string)[], value: StringifyProperty) => {
  if (value && typeof value === 'object' && UnquotedSymbol in value) {
    return value[UnquotedSymbol]
  }

  return stringify(value, parents)
}

export const resizeFirstChar = (text: string, capitalize: boolean): string => {
  if (capitalize === true) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return text.charAt(0).toLowerCase() + text.slice(1)
}

export const getCollectionId = (name: string) => resizeFirstChar(name, false)

export const getExtendName = (name: string) => `extend${resizeFirstChar(name, true)}Collection`

