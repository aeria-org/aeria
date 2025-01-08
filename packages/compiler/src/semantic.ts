import { Result } from '@aeriajs/types'
import { isValidCollection } from '@aeriajs/common'
import * as AST from './ast.js'

export const analyze = async (ast: AST.Node[], errors: unknown[] = []) => {
  for( const node of ast ) {
    switch( node.type ) {
      case 'collection': {
        for( const propName in node.properties ) {
          const { property } = node.properties[propName]
          if( '$ref' in property ) {
            const foreignCollectionName = property.$ref
            const foreignCollection = AST.findNode(ast, {
              type: 'collection',
              name: foreignCollectionName,
            })

            if( !foreignCollection ) {
              throw new Error
            }

            if( property.indexes ) {
              for( const foreignPropName of property.indexes ) {
                if( !(foreignPropName in foreignCollection.properties) ) {
                  if( foreignCollection.extends ) {
                    const { packageName, symbolName } = foreignCollection.extends
                    const { [symbolName]: importedCollection } = await import(packageName)

                    if( !isValidCollection(importedCollection) ) {
                      throw new Error
                    }

                    if( !(foreignPropName in importedCollection.description.properties) ) {
                      errors.push({
                        message: `collection "${foreignCollectionName}" hasn't such property "${foreignPropName}"`,
                      })
                    }
                  }

                }
              }
            }
          }
        }
        break
      }
      case 'contract': {
        break
      }
    }
  }

  if( errors.length ) {
    return Result.error(errors)
  }

  return Result.result({})
}

