import type { FunctionAttributes } from '@aeriajs/types'

export const defineFunctionAttributes = <TFunction extends (...args: any[])=> any>(
  fn: TFunction,
  attributes: FunctionAttributes,
) => {
  Object.assign(fn, attributes)
  Object.freeze(fn)
  return fn
}

export const defineExposedFunction = <TFunction extends (...args: any[])=> any>(fn: TFunction) => {
  return defineFunctionAttributes(fn, {
    exposed: true,
  })
}

