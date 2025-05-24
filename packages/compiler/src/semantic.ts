import type { Location } from './token.js'
import type { ArrayProperties } from './utils.js'
import type { CompilationOptions } from './types.js'
import { isValidCollection } from '@aeriajs/common'
import { locationMap } from './parser.js'
import { Diagnostic } from './diagnostic.js'
import * as AST from './ast.js'

const collectionHasProperty = async (collection: AST.CollectionNode, propName: string, options: Pick<CompilationOptions, 'languageServer'> = {}) => {
  let hasProperty = propName in collection.properties
  if( !hasProperty ) {
    if( collection.extends ) {
      if( options.languageServer ) {
        return true
      }

      const { packageName, symbolName } = collection.extends
      const { [symbolName]: importedCollection } = await import(packageName)

      if( !isValidCollection(importedCollection) ) {
        throw new Error
      }

      hasProperty = propName in importedCollection.description.properties
    }
  }

  return hasProperty
}

export const analyze = async (ast: AST.ProgramNode, options: Pick<CompilationOptions, 'languageServer'>, errors: Diagnostic[] = []) => {
  const checkCollectionForeignProperties = async <TProperty extends Extract<AST.PropertyNode['property'], { $ref: string }>>(
    foreignCollection: AST.CollectionNode,
    property: TProperty,
    attributeName: ArrayProperties<TProperty>,
  ) => {
    if( !property[attributeName] ) {
      return
    }

    for( const foreignPropName of property[attributeName] as string[] ) {
      if( !await collectionHasProperty(foreignCollection, foreignPropName, options) ) {
        let location: Location | undefined
        if( property[AST.LOCATION_SYMBOL] ) {
          location = locationMap.get(property[AST.LOCATION_SYMBOL].attributes[attributeName])
        }

        errors.push(new Diagnostic(`collection "${foreignCollection.name}" hasn't such property "${foreignPropName}"`, location))
      }
    }
  }

  const checkCollectionLocalProperties = async (node: AST.CollectionNode, attributeName: ArrayProperties<AST.CollectionNode>) => {
    if( !node[attributeName] ) {
      return
    }

    for( const index in node[attributeName] ) {
      const propName = node[attributeName][index]
      if( !await collectionHasProperty(node, propName, options) ) {
        const symbol = node[AST.LOCATION_SYMBOL].arrays[attributeName]![index]
        const location = locationMap.get(symbol)

        errors.push(new Diagnostic(`collection "${node.name}" hasn't such property "${propName}"`, location))
      }
    }
  }

  const checkObjectLocalProperties = async (node: AST.PropertyNode, attributeName: ArrayProperties<Extract<AST.PropertyNode['property'], { properties: unknown }>>) => {
    if( !('properties' in node.property) || !node.property[attributeName] ) {
      return
    }

    for( const index in node.property[attributeName] ) {
      const propName = node.property[attributeName][index]
      if( !(propName in node.property.properties) ) {
        const symbol = node.property[AST.LOCATION_SYMBOL]!.arrays[attributeName]![index]
        const location = locationMap.get(symbol)

        errors.push(new Diagnostic(`object hasn't such property "${propName}"`, location))
      }
    }
  }

  const recurseProperty = async (node: AST.PropertyNode) => {
    if( 'type' in node.property && node.property.type === 'object' ) {
      if( typeof node.nestedAdditionalProperties === 'object' ) {
        await recurseProperty(node.nestedAdditionalProperties)
      }

      if( node.nestedProperties ) {
        await checkObjectLocalProperties(node, 'required')
        await checkObjectLocalProperties(node, 'writable')
        await checkObjectLocalProperties(node, 'form')

        for( const propName in node.nestedProperties ) {
          const subProperty = node.nestedProperties[propName]
          await recurseProperty(subProperty)
        }
      }
    } else if( '$ref' in node.property ) {
      const refName = node.property.$ref
      const foreignCollection = ast.collections.find(({ name }) => name === refName)

      if( !foreignCollection ) {
        const location = locationMap.get(node.property[AST.LOCATION_SYMBOL]!.type)
        errors.push(new Diagnostic(`invalid reference "${refName}"`, location))
        return
      }

      await checkCollectionForeignProperties(foreignCollection, node.property, 'indexes')
      await checkCollectionForeignProperties(foreignCollection, node.property, 'populate')
      await checkCollectionForeignProperties(foreignCollection, node.property, 'form')

      if( node.property.constraints ) {
        for( const [name, symbol] of node.property[AST.LOCATION_SYMBOL]!.contraintTerms! ) {
          if( !await collectionHasProperty(foreignCollection, name) ) {
            const location = locationMap.get(symbol)
            errors.push(new Diagnostic(`left operand "${name}" does not exist on collection "${foreignCollection.name}"`, location))
          }
        }
      }

    } else if( 'items' in node.property ) {
      await recurseProperty({
        kind: 'property',
        property: node.property.items,
      })
    }
  }

  for( const node of ast.collections ) {
    await checkCollectionLocalProperties(node, 'indexes')
    await checkCollectionLocalProperties(node, 'filters')
    await checkCollectionLocalProperties(node, 'form')
    await checkCollectionLocalProperties(node, 'table')
    await checkCollectionLocalProperties(node, 'tableMeta')

    if( node.required ) {
      const propNames = Array.isArray(node.required)
        ? node.required
        : Object.keys(node.required)

      for( const index in propNames ) {
        const propName = propNames[index]

        if( !(propName in node.properties) ) {
          const symbol = node[AST.LOCATION_SYMBOL].required![index]
          const location = locationMap.get(symbol)

          errors.push(new Diagnostic(`collection "${node.name}" hasn't such property "${propName}"`, location))
        }
      }
    }

    for( const propName in node.properties ) {
      const subNode = node.properties[propName]
      await recurseProperty(subNode)
    }

    if( node[AST.LOCATION_SYMBOL].requiredTerms ) {
      for( const [name, symbol] of node[AST.LOCATION_SYMBOL].requiredTerms ) {
        if( !(name in node.properties) ) {
          const location = locationMap.get(symbol)
          errors.push(new Diagnostic(`invalid left operand "${name}"`, location))
        }
      }
    }

    if( node.layout ) {
      if( node.layout.options ) {
        for( const [name, value] of Object.entries(node.layout[AST.LOCATION_SYMBOL].options) ) {
          const option = node.layout.options[name as keyof typeof node.layout.options]!

          if( Array.isArray(option) ) {
            for( const [i, propName] of option.entries() ) {
              if( !(propName in node.properties) ) {
                const location = locationMap.get((value as symbol[])[i])
                errors.push(new Diagnostic(`invalid property "${propName}"`, location))
              }
            }
          } else {
            if( !(option as string in node.properties) ) {
              const location = locationMap.get(value as symbol)
              errors.push(new Diagnostic(`invalid property "${option}"`, location))
            }
          }
        }
      }
    }

    if( node.formLayout ) {
      if( node.formLayout.fields ) {
        for( const [name, value] of Object.entries(node.formLayout[AST.LOCATION_SYMBOL].fields) ) {
          if( !(name in node.properties) ) {
            const location = locationMap.get(value.name)
            errors.push(new Diagnostic(`invalid property "${name}"`, location))
          }
        }
      }

      if( node.formLayout[AST.LOCATION_SYMBOL].terms ) {
        for( const [name, symbol] of node.formLayout[AST.LOCATION_SYMBOL].terms ) {
          if( !(name in node.properties) ) {
            const location = locationMap.get(symbol)
            errors.push(new Diagnostic(`invalid left operand "${name}"`, location))
          }
        }
      }
    }
  }

  for( const node of ast.contracts ) {
    if( node.payload ) {
      await recurseProperty(node.payload)
    }
    if( node.query ) {
      await recurseProperty(node.query)
    }
    if( node.response ) {
      if( Array.isArray(node.response) ) {
        for( const subNode of node.response ) {
          await recurseProperty(subNode)
        }
      } else {
        await recurseProperty(node.response)
      }
    }
  }

  return {
    errors,
  }
}

