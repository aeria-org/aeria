import { Property, Result } from '@aeriajs/types'
import { isValidCollection } from '@aeriajs/common'
import * as AST from './ast.js'

export const analyze = async (ast: AST.Node[], errors: unknown[] = []) => {
  const checkForeignProperties = async (foreignCollection: AST.CollectionNode, propNames: readonly string[]) => {
    for( const foreignPropName of propNames ) {
      let hasProperty = foreignPropName in foreignCollection.properties
      if( !hasProperty ) {
        if( foreignCollection.extends ) {
          const { packageName, symbolName } = foreignCollection.extends
          const { [symbolName]: importedCollection } = await import(packageName)

          if( !isValidCollection(importedCollection) ) {
            throw new Error
          }

          hasProperty = foreignPropName in importedCollection.description.properties
        }
      }

      if( !hasProperty ) {
        errors.push({
          message: `collection "${foreignCollection.name}" hasn't such property "${foreignPropName}"`,
        })
      }
    }
  }

  const recurseProperty = async (node: AST.PropertyNode) => {
    if( node.nestedProperties && 'nestedProperties' in node ) {
      for( const propName in node.nestedProperties ) {
        const subProperty = node.nestedProperties[propName]
        await recurseProperty(subProperty)
      }
    } else if( '$ref' in node.property ) {
      const foreignCollection = AST.findNode(ast, {
        type: 'collection',
        name: node.property.$ref,
      })

      if( !foreignCollection ) {
        throw new Error
      }

      if( node.property.indexes ) {
        await checkForeignProperties(foreignCollection, node.property.indexes)
      }
      if( node.property.populate ) {
        await checkForeignProperties(foreignCollection, node.property.populate)
      }
      if( node.property.form ) {
        await checkForeignProperties(foreignCollection, node.property.form)
      }
    }
  }

  for( const node of ast ) {
    switch( node.type ) {
      case 'collection': {
        for( const propName in node.properties ) {
          const subNode = node.properties[propName]
          await recurseProperty(subNode)
        }
        break
      }
      case 'contract': {
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
        break
      }
    }
  }

  if( errors.length ) {
    return Result.error(errors)
  }

  return Result.result({})
}

