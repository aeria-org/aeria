import type * as AST from '../ast'
import { functions as aeriaFunctions } from 'aeria'

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
    code: Object.keys(toImport).map((key) => `import { ${[...toImport[key]].join(', ')} } from '${key}'`),
    modifiedSymbols,
  }
}

/** Transforms the AST properties to the format of aeria schema properties */
export const getCollectionProperties = (properties: AST.CollectionNode['properties']) => {
  return Object.entries(properties).reduce<Record<string, any>>((acc, [key, value]) => {
    if (value.nestedProperties) {
      acc[key] = {
        ...value.property,
        properties: getCollectionProperties(value.nestedProperties),
      }
    } else {
      acc[key] = value.property
    }
    return acc
  }, {})
}

/** Assure if specific fields needs to be between quotes or not */
export const stringify = (node: Record<string, any>, parents: string[] = []) => {
  if (typeof node !== 'object' || Array.isArray(node)) {
    return JSON.stringify(node)
  }

  const objectString: string = Object.keys(node).map((key) => {
    const currentParents = [
      ...parents,
      key,
    ]

    const prefix = '\t'.repeat(currentParents.length)

    return !betweenQuotes(currentParents, String(node[key]))
      ? `${prefix}${key}: ${stringify(node[key], currentParents).replaceAll('"', '')}`
      : `${prefix}${key}: ${stringify(node[key], currentParents)}`
  }).join(',\n')

  return `{\n${objectString}\n${'\t'.repeat(parents.length)}}`
}

const booleanValues = [
  'true',
  'false',
]

const nonStringAttributes = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'default',
  'functions',
]

const betweenQuotes = (parents: string[], value: string) =>
  !value.includes('typeof') && !booleanValues.includes(value) && !parents.some((parent) => nonStringAttributes.includes(parent))

/** Used to make the id and the schema name of the collection */
export const resizeFirstChar = (name: string, capitalize: boolean): string => name.charAt(0)[capitalize
  ? 'toUpperCase'
  : 'toLowerCase']() + name.slice(1)

export const getExtendName = (name: string) => `extend${resizeFirstChar(name, true)}Collection`
