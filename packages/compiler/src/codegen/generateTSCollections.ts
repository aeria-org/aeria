import type { Collection } from '@aeriajs/types'
import type * as AST from '../ast.js'
import { transformSymbolName } from '../utils.js'
import { unwrapNode, recursivelyUnwrapPropertyNodes, stringify, makeASTImports, getCollectionId, UnquotedSymbol, getExposedFunctions, PACKAGE_NAME, type StringifyProperty } from './utils.js'

const initialImportedTypes = [
  'Collection',
  'SchemaWithId',
  'ExtendCollection',
  'Context',
]

const makeTSFunctions = (collectionNode: AST.CollectionNode) => {
  const funs: Record<string, StringifyProperty> = {}

  for( const functionNode of collectionNode.functions! ) {
    funs[functionNode.name] = {
      [UnquotedSymbol]: functionNode.exportSymbol
        ? `typeof import('${functionNode.exportSymbol.importPath}').${functionNode.exportSymbol.symbolName}`
        : 'unknown',
    }
  }

  return funs
}

export const generateTSCollections = async (ast: AST.ProgramNode) => {
  let code = ''
  code += `import type { ${initialImportedTypes.join(', ')} } from '${PACKAGE_NAME}'\n` //Used types
  const importsResult = makeASTImports(ast.collections)
  code += importsResult.code.join('\n') + '\n\n'
  code += makeTSCollections(ast, importsResult.aliasedSymbols) + '\n'
  return code
}

const makeTSCollections = (ast: AST.ProgramNode, aliasedSymbols: Record<string, string>) => {
  const collectionCodes: Record<string, string> = {}

  for (const collectionNode of ast.collections) {
    const id = getCollectionId(collectionNode.name)
    const schemaName = transformSymbolName(collectionNode.name, {
      capitalize: true,
    })
    const typeName = `${id}Collection`

    const collectionType = `export declare type ${typeName} = ${id in aliasedSymbols
      ? `ExtendCollection<typeof ${aliasedSymbols[id]}, ${makeTSCollectionSchema(collectionNode, id)}>`
      : makeTSCollectionSchema(collectionNode, id)
    }`

    const collectionDeclaration = `export declare const ${id}: ${typeName} & { item: SchemaWithId<${typeName}["description"]> }`

    const collectionSchema = `export declare type ${schemaName} = SchemaWithId<typeof ${id}.description>`

    const collectionExtend = `export declare const extend${schemaName}Collection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof ${id}["description"]>) => unknown
              }
            }>(collection: TCollection) => ExtendCollection<typeof ${id}, TCollection>`

    collectionCodes[collectionNode.name] = [
      '//' + collectionNode.name,
      collectionType,
      collectionDeclaration,
      collectionSchema,
      collectionExtend,
    ].join('\n')
  }

  return Object.values(collectionCodes).join('\n\n')
}

const makeTSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Omit<Collection, 'middlewares' | 'functions'> & { middlewares?: unknown,
    functions?: unknown } = {
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
        collectionSchema.description.properties = recursivelyUnwrapPropertyNodes(collectionNode[key])
        break
      case 'owned':
        collectionSchema.description.owned = collectionNode[key]
        break
      case 'middlewares':
        collectionSchema.middlewares = {
          [UnquotedSymbol]: "import('@aeriajs/types').CollectionMiddleware<unknown>[]",
        }
        break
      case 'functions':
        collectionSchema.functions = makeTSFunctions(collectionNode)
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

