import type * as AST from '../ast'
import type { Property } from '@aeriajs/types'
import { functions as aeriaFunctions } from '@aeriajs/core'

export const aeriaPackageName = 'aeria'
export const defaultFunctions = Object.keys(aeriaFunctions)

export const ArraySymbol = Symbol('array')

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
        const functionsToImport = Object.keys(node.functions).filter((key) => defaultFunctions.includes(key))
        if (functionsToImport.length > 0) {
          if (!(aeriaPackageName in imports)) {
            imports[aeriaPackageName] = new Set()
          }

          for (const key of functionsToImport) {
            imports[aeriaPackageName].add(key)
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

export const propertyToSchema = (propertyNode: AST.PropertyNode) => {
  if ('$ref' in propertyNode.property) {
    propertyNode.property.$ref = getCollectionId(propertyNode.property.$ref)
  }
  return {
    ...propertyNode.property,
    ...(propertyNode.nestedProperties && {
      properties: getProperties(propertyNode.nestedProperties),
    }),
  } as Property
}

/** Transforms the AST properties to the format of aeria schema properties */
export const getProperties = (properties: Record<string, AST.PropertyNode | AST.PropertyNode[]>) => {
  return Object.entries(properties).reduce<Record<string, Property | Property[]>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((propertyNode) => propertyToSchema(propertyNode))
    } else {
      acc[key] = propertyToSchema(value)
    }
    return acc
  }, {})
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

