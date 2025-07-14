import type { Collection } from '@aeriajs/types'
import type * as AST from '../ast.js'
import { unwrapNode, recursivelyUnwrapPropertyNodes, stringify, makeASTImports, getCollectionId, UnquotedSymbol, getExposedFunctions, getExtendName, PACKAGE_NAME } from './utils.js'

const initialImportedFunctions = [
  'extendCollection',
  'defineCollection',
]

export const generateJSCollections = async (ast: AST.ProgramNode) => {
  let javascriptCode = ''
  const importsResult = makeASTImports(ast.collections, {
    [PACKAGE_NAME]: new Set(initialImportedFunctions),
  }, {
    includeRuntimeOnlyImports: true,
  })

  javascriptCode += importsResult.code.join('\n') + '\n\n'
  javascriptCode += await makeJSCollections(ast, importsResult.aliasedSymbols) + '\n\n'

  return javascriptCode
}

const makeJSFunctions = async (collectionNode: AST.CollectionNode) => {
  let output = ''
  for( const functionNode of collectionNode.functions! ) {
    if( collectionNode.extends ) {
      const module = await import(collectionNode.extends.importPath)
      const collection = module[collectionNode.extends.symbolName] as Collection

      if( collection.functions && collection.functions[functionNode.name] ) {
        continue
      }
    }

    output += functionNode.exportSymbol
      ? functionNode.exportSymbol.symbolName
      : `${functionNode.name}: () => { throw new Error('Function not implemented') }`

    output += ', '
  }

  return output
}

const makeJSCollections = async (ast: AST.ProgramNode, aliasedSymbols: Record<string, string>) => {
  const collectionCodes: Record<string, string> = {}

  for (const collectionNode of ast.collections) {
    const id = getCollectionId(collectionNode.name)
    const extendCollectionName = getExtendName(collectionNode.name)

    const collectionDefinition =
      `export const ${id} = ${collectionNode.extends
        ? `extendCollection(${id in aliasedSymbols
          ? aliasedSymbols[id]
          : id}, ${await makeJSCollectionSchema(ast, collectionNode, id)})`
        : `defineCollection(${await makeJSCollectionSchema(ast, collectionNode, id)})`}`

    const collectionDeclaration =
      `export const ${extendCollectionName} = (collection) => extendCollection(${id}, collection)`

    collectionCodes[collectionNode.name] = [
      '//' + collectionNode.name,
      collectionDefinition,
      collectionDeclaration,
    ].join('\n')
  }

  return Object.values(collectionCodes).join('\n\n')
}

const makeJSCollectionSchema = async (ast: AST.ProgramNode, collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Omit<Collection, 'middlewares'> & { middlewares?: unknown } = {
    item: {},
    description: {
      $id: collectionId,
      properties: {},
    },
  }

  for (const key of Object.keys(collectionNode) as Array<keyof typeof collectionNode>) {
    if (collectionNode[key] === undefined) {
      continue
    }

    switch (key) {
      case 'properties':
        collectionSchema.description[key] = recursivelyUnwrapPropertyNodes(collectionNode[key])
        break
      case 'owned':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'middlewares':
        collectionSchema.middlewares = {
          [UnquotedSymbol]: `[ ${collectionNode[key].join(', ') } ]`,
        }
        break
      case 'functions':
        collectionSchema.functions = {
          [UnquotedSymbol]: `{ ${await makeJSFunctions(collectionNode)} }`,
        }
        collectionSchema.exposedFunctions = getExposedFunctions(collectionNode[key])
        break
      case 'required':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'table':
      case 'tableMeta':
      case 'filters':
      case 'indexes':
      case 'form':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'actions':
      case 'individualActions':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'icon':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'presets':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'search':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'layout':
        collectionSchema.description[key] = unwrapNode(collectionNode[key])
        break
      case 'formLayout':
        collectionSchema.description[key] = unwrapNode(collectionNode[key])
        break
    }
  }

  return stringify(collectionSchema)
}

