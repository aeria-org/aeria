import type * as AST from '../ast'
import { functions as aeriaFunctions, type Property } from 'aeria'

export const aeriaPackageName = 'aeria'

/**
 * Obs: It will save and return any modified symbols to avoid name duplication later
*/
export const makeASTImports = (ast: AST.Node[], initialImports?: Record<string, Set<string>>) => {
  const modifiedSymbols: Record<string, string> = {}

  const toImport = ast.reduce((imports, node) => {
    if (node.type === 'collection') {
      if (node.extends?.packageName) {
        if (!(node.extends.packageName in imports)) {
          imports[node.extends.packageName] = new Set()
        }

        const modifiedSymbol = `original${resizeFirstChar(node.extends.symbolName, true)}`
        modifiedSymbols[node.extends.symbolName] = modifiedSymbol
        imports[node.extends.packageName].add(`${node.extends.symbolName} as ${modifiedSymbol}`)
      }

      if (node.functions) {
        const functionsToImport = Object.keys(node.functions).filter((key) => Object.keys(aeriaFunctions).includes(key))
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

/** Serves to know if the value must be unquoted on strinfigy function */
export type StringifyProperty<T> = T extends object ? Record<string, any> & {
  ['@unquoted']?: string,
} : T

/** Assure if specific fields needs to be between quotes or not */
export const stringify = (value: StringifyProperty<string | unknown[] | object>, parents: string[] = []) => {
  if (Array.isArray(value)) {
    let arrayString = '[\n'

    value.map((element: StringifyProperty<string | object>) => {
      const currentParents = [
        ...parents,
        '@array',
      ]

      arrayString += '\t'.repeat(currentParents.length) +
        checkQuotes(currentParents, element) + ',\n'
    })

    return arrayString + `${'\t'.repeat(parents.length)}]`
  }

  if (typeof value !== 'object') {
    return typeof value === 'number'
      ? value
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

const checkQuotes = (parents: string[], value: StringifyProperty<string | object>): string => {
  if (typeof value === 'object' && value['@unquoted']) {
    return value['@unquoted']
  }

  return stringify(value, parents)
}

/** Used to make the id and the schema name of the collection */
export const resizeFirstChar = (text: string, capitalize: boolean): string => text.charAt(0)[capitalize
  ? 'toUpperCase'
  : 'toLowerCase']() + text.slice(1)

export const getCollectionId = (name: string) => resizeFirstChar(name, false)

export const getExtendName = (name: string) => `extend${resizeFirstChar(name, true)}Collection`
