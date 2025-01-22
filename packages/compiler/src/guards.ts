import * as AST from './ast.js'

export const isNativePropertyType = (value: string): value is keyof typeof AST.PropertyType => {
  return value in AST.PropertyType
}

export const isValidPropertyModifier = (value: string): value is keyof typeof AST.PropertyModifiers => {
  return value in AST.PropertyModifiers
}

