export type MergeOptions = {
  arrays?: false
  callback?: (key: string, leftVal: unknown, rightVal: unknown)=> unknown
}

export const deepMerge = <
  const TLeft,
  const TRight,
>(left: TLeft, right: TRight, options?: MergeOptions) => {
  const result: any = Object.assign({}, left)
  const { arrays = true } = options || {}

  for( const key in right ) {
    const leftVal = result[key]
    const rightVal: any = right[key]

    if( options?.callback ) {
      const res = options.callback(key, leftVal, rightVal)
      if( res !== undefined ) {
        result[key] = res
        continue
      }
    }

    if( Array.isArray(leftVal) && Array.isArray(rightVal) ) {
      result[key] = arrays
        ? result[key].concat(...rightVal)
        : rightVal

      continue
    }

    if( rightVal instanceof Function ) {
      result[key] = rightVal
      continue
    }

    if( leftVal instanceof Object && rightVal instanceof Object ) {
      if( rightVal.constructor !== Object ) {
        result[key] = rightVal
        continue
      }

      result[key] = deepMerge(leftVal, rightVal, options)
      continue
    }

    result[key] = rightVal
  }

  return result as TLeft & TRight
}

