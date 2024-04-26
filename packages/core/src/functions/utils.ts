import type { FunctionAttributes } from '@aeriajs/types'

export const defineFunctionAttributes = (fn: (...args: any[]) => any, attributes: FunctionAttributes) => {
  Object.assign(fn, attributes)
}

export const defineExposedFunction = (fn: (...args: any[]) => any) => {
  defineFunctionAttributes(fn, {
    exposed: true
  })

  return fn
}

