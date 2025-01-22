import { Collection, Property } from '@aeriajs/types'
import type * as AST from '../ast.js'
import { makeASTImports, getProperties, stringify, aeriaPackageName, getExtendName, getCollectionId, type StringifyProperty, UnquotedSymbol } from './utils.js'

const initialImportedFunctions = [
  'extendCollection',
  'defineCollection',
  'defineContract',
]

export const generateJSCollections = (ast: AST.Node[]) => {
  let javascriptCode = ''
  const importsResult = makeASTImports(ast, {
    [aeriaPackageName]: new Set(initialImportedFunctions),
  })
  javascriptCode += importsResult.code + '\n\n'
  javascriptCode += makeJSCollections(ast, importsResult.modifiedSymbols) + '\n\n'

  return javascriptCode
}

const makeJSCollections = (ast: AST.Node[], modifiedSymbols: Record<string, string>) => {
  return ast.filter((node) => node.kind === 'collection')
    .map((collectionNode) => {
      const id = getCollectionId(collectionNode.name) //CollectionName -> collectionName
      const extendCollectionName = getExtendName(collectionNode.name)

      const collectionDefinition =
            `export const ${id} = ${collectionNode.extends
              ? 'extendCollection'
              : 'defineCollection'}(${makeJSCollectionSchema(collectionNode, id)})`

      const collectionDeclaration =
      `export const ${extendCollectionName} = (collection) => extendCollection(${id in modifiedSymbols
        ? modifiedSymbols[id]
        : id}, collection)`

      return [
        '//' + collectionNode.name,
        collectionDefinition,
        collectionDeclaration,
      ].join('\n')
    }).join('\n\n')
}

const makeJSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Omit<Collection, 'item' | 'functions'> & { functions?: StringifyProperty } = {
    description: {
      $id: collectionId,
      properties: getProperties(collectionNode.properties) as Record<string, Property>,
    },
  }

  if (collectionNode.owned === true) {
    collectionSchema.description.owned = true
  }

  if( collectionNode.functions ) {
    collectionSchema.functions = {
      [UnquotedSymbol]: `{ ${makeJSFunctions(collectionNode.functions)} }`,
    }
  }

  return stringify(collectionSchema)
}

const makeJSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.entries(functions).map(([key, value]) => value.fromFunctionSet
    ? key
    : `${key}: () => { throw new Error('Function not implemented') }`).join(', ')
}
