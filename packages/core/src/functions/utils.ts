import type { FunctionAttributes } from '@aeriajs/types'

export const defineFunctionAttributes = (fn: (...args: any[])=> any, attributes: FunctionAttributes) => {
  Object.assign(fn, attributes)
  Object.freeze(fn)
  return fn
}

export const defineExposedFunction = (fn: (...args: any[])=> any) => {
  return defineFunctionAttributes(fn, {
    exposed: true,
  })
}

