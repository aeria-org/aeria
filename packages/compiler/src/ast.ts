import type { ASTNode, ASTNodeType } from './index.js'

export const findNode = <TASTNodeType extends ASTNodeType>(
  ast: ASTNode[],
  { type, name }: {
    type: TASTNodeType,
    name: string
  },
) => {
  return ast.find((node) => {
    return node.type === type && node.name === name
  }) as Extract<ASTNode, { type: TASTNodeType }> | undefined
}

