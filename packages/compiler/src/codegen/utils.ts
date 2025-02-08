import type * as AST from '../ast.js'
import type { Property } from '@aeriajs/types'

export const PACKAGE_NAME = 'aeria'

export const DEFAULT_FUNCTIONS = [
  'count',
  'get',
  'getAll',
  'insert',
  'upload',
  'remove',
  'removeAll',
  'removeFile',
]

export const ArraySymbol = Symbol('array')

export const getExposedFunctions = (astFunctions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.fromEntries(Object.entries(astFunctions)
    .map(([key, value]) => [
      key,
      value.accessCondition,
    ]))
}

/**
 * Obs: It will save and return any modified symbols to avoid name duplication later
*/
export const makeASTImports = (ast: AST.Node[], initialImports?: Record<string, Set<string>>) => {
  const modifiedSymbols: Record<string, string> = {}

  const toImport = ast.reduce((imports, node) => {
    if (node.kind === 'collection') {
      if (node.extends?.packageName) {
        if (!(node.extends.packageName in imports)) {
          imports[node.extends.packageName] = new Set()
        }

        const modifiedSymbol = `original${resizeFirstChar(node.extends.symbolName, true)}`
        modifiedSymbols[node.extends.symbolName] = modifiedSymbol
        imports[node.extends.packageName].add(`${node.extends.symbolName} as ${modifiedSymbol}`)
      }

      if (node.functions) {
        const functionsToImport = Object.keys(node.functions).filter((key) => DEFAULT_FUNCTIONS.includes(key))
        if (functionsToImport.length > 0) {
          if (!(PACKAGE_NAME in imports)) {
            imports[PACKAGE_NAME] = new Set()
          }

          for (const key of functionsToImport) {
            imports[PACKAGE_NAME].add(key)
          }
        }
      }
    }

    return imports
  }, initialImports ?? {})

  return {
    code: Object.keys(toImport).map((key) => `import { ${Array.from(toImport[key]).join(', ')} } from '${key}'`),
    modifiedSymbols,
  }
}

export const propertyToSchema = (propertyNode: AST.PropertyNode): Property => {
  const propertySchema: Property = propertyNode.property

  if ('$ref' in propertySchema) {
    propertySchema.$ref = getCollectionId(propertySchema.$ref)
  } else if ('items' in propertySchema && '$ref' in propertySchema.items) {
    propertySchema.items.$ref = getCollectionId(propertySchema.items.$ref)
  }

  if (propertyNode.nestedProperties && 'type' in propertySchema) {
    if (propertySchema.type === 'object' && 'properties' in propertySchema) {
      propertySchema.properties = getProperties(propertyNode.nestedProperties)
    } else if (propertySchema.type === 'array') {
      propertySchema.items = {
        type: 'object',
        properties: getProperties(propertyNode.nestedProperties),
      }
    }
  }

  return propertySchema
}

/** Transforms the AST properties to the format of aeria schema properties */
export const getProperties = <
  TProperties extends Record<string, AST.PropertyNode | AST.PropertyNode[]>,
  TReturnType = TProperties[keyof TProperties] extends Array<unknown> ? Record<string, Property[]> : Record<string, Property>,
>
(properties: TProperties): TReturnType => {
  return Object.entries(properties).reduce<Record<string, Property | Property[]>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((propertyNode) => propertyToSchema(propertyNode))
    } else {
      acc[key] = propertyToSchema(value)
    }
    return acc
  }, {}) as TReturnType
}

export const UnquotedSymbol = Symbol('unquoted')
/** Serves to know if the value must be unquoted on strinfigy function */
export type StringifyProperty = unknown | {
  [UnquotedSymbol]: string,
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object'

/** Assure if specific fields needs to be between quotes or not */
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

  const objectString: string = Object.keys(value).map((key) => {
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

/** Used to make the id and the schema name of the collection */
export const resizeFirstChar = (text: string, capitalize: boolean): string => {
  if (capitalize === true) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return text.charAt(0).toLowerCase() + text.slice(1)
}

export const getCollectionId = (name: string) => resizeFirstChar(name, false)

export const getExtendName = (name: string) => `extend${resizeFirstChar(name, true)}Collection`

