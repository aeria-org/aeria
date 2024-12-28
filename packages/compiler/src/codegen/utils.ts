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

/** Transforms the AST properties to the format of aeria schema properties */
export const getProperties = (properties: AST.CollectionNode['properties']) => {
  return Object.entries(properties).reduce<Record<string, any>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map(v => ({
        ...v.property,
        ...(v.nestedProperties && { properties: getProperties(v.nestedProperties) })
      }))
    }
    else if ('properties' in value.property && value.nestedProperties) {
      acc[key] = {
        ...value.property,
        properties: getProperties(value.nestedProperties),
      }
    } else {
      acc[key] = value.property
    }
    return acc
  }, {})
}

const isNotJSONSerializable = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object'
}

/** Assure if specific fields needs to be between quotes or not */
export const stringify = (value: unknown, parents: string[] = []) => {
  if (Array.isArray(value)) {
    const arrayString: string = value.map((v: any) => {
      const currentParents = [
        ...parents,
        'array',
      ]

      return '\t'.repeat(currentParents.length) + (!betweenQuotes(currentParents, String(v))
        ? stringify(v, currentParents).replaceAll('"', '')
        : stringify(v, currentParents))
    }).join(',\n')

    return `[\n${arrayString}\n${'\t'.repeat(parents.length)}]`
  }

  if (!isNotJSONSerializable(value)) {
    return JSON.stringify(value, null, '\t')
  }

  const objectString: string = Object.keys(value).map((key) => {
    const currentParents = [
      ...parents,
      key,
    ]

    const prefix = '\t'.repeat(currentParents.length)

    return !betweenQuotes(currentParents, String(value[key]))
      ? `${prefix}${key}: ${stringify(value[key], currentParents).replaceAll('"', '')}`
      : `${prefix}${key}: ${stringify(value[key], currentParents)}`
  }).join(',\n')

  return `{\n${objectString}\n${'\t'.repeat(parents.length)}}`
}

const betweenQuotes = (parents: string[], value: string) =>
  !value.includes('typeof') && !parents.includes('functions')

/** Used to make the id and the schema name of the collection */
export const resizeFirstChar = (name: string, capitalize: boolean): string => name.charAt(0)[capitalize
  ? 'toUpperCase'
  : 'toLowerCase']() + name.slice(1)

export const getExtendName = (name: string) => `extend${resizeFirstChar(name, true)}Collection`
