import type * as AST from '../ast.js'
import { getProperties, stringify, makeASTImports, resizeFirstChar, aeriaPackageName, getCollectionId, type StringifyProperty, UnquotedSymbol, defaultFunctions, getExposedFunctions } from './utils.js'
import { type Description, type RequiredProperties } from '@aeriajs/types'

const initialImportedTypes = [
  'Collection',
  'SchemaWithId',
  'ExtendCollection',
  'Context',
]

export const generateTSCollections = (ast: AST.CollectionNode[]): string => {
  let code = ''
  code += `import type { ${initialImportedTypes.join(', ')} } from '${aeriaPackageName}'\n` //Used types
  const importsResult = makeASTImports(ast)
  code += importsResult.code + '\n\n'
  code += makeTSCollections(ast, importsResult.modifiedSymbols) + '\n'
  return code
}

/** Creates the code exporting the collection type, declaration, schema and extend for each collection and returns them in a string */
const makeTSCollections = (ast: AST.CollectionNode[], modifiedSymbols: Record<string, string>) => {
  const collectionCodes: Record<string, string> = {}

  for (const collectionNode of ast) {
    const id = getCollectionId(collectionNode.name) // CollectionName -> collectionName
    const schemaName = resizeFirstChar(collectionNode.name, true) // collectionName -> CollectionName
    const typeName = id + 'Collection' // Pet -> petCollection

    const collectionType = `export declare type ${typeName} = ${id in modifiedSymbols
      ? `ExtendCollection<typeof ${modifiedSymbols[id]}, ${makeTSCollectionSchema(collectionNode, id)}>`
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
  const collectionSchema: Record<string, unknown>
    & { description: Partial<Description> } = {
      description: {
        $id: collectionId,
      },
    }

  for (const key of Object.keys(collectionNode) as Array<keyof typeof collectionNode>) {
    if (collectionNode[key] === undefined) {
      continue
    }

    switch (key) {
      case 'properties':
        collectionSchema.description.properties = getProperties(collectionNode[key])
        break

      case 'owned':
        collectionSchema.description.owned = collectionNode[key]
        break

      case 'functions':
        collectionSchema.functions = makeTSFunctions(collectionNode[key])
        collectionSchema.exposedFunctions = getExposedFunctions(collectionNode[key])
        break

      case 'actions':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'filters':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'form':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'icon':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'indexes':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'individualActions':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'presets':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'table':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'search':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'required':
        collectionSchema.description[key] = collectionNode[key] as RequiredProperties<any>
        break
    }
  }

  return stringify(collectionSchema)
}

/** Turns each function to 'typeof functioName' if it's from aeria or not */
const makeTSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.keys(functions).reduce<Record<string, StringifyProperty>>((acc, key) => {
    acc[key] = {
      [UnquotedSymbol]: defaultFunctions.includes(key)
        ? `typeof ${key}`
        : '() => never',
    }
    return acc
  }, {})
}
