export type PipeOptions<TFunction extends (...args: unknown[])=> unknown> = {
  returnFirst?: boolean | ((value: unknown)=> ReturnType<TFunction>)
}

export const pipe = <TFunction extends (...args: unknown[])=> unknown>(functions: TFunction[], options?: PipeOptions<TFunction>) => {
  const { returnFirst } = options || {}

  return async (
    value: Parameters<TFunction>[0],
    ...args: Parameters<TFunction> extends [unknown, ...infer Tail] ? Tail : []
  ) => {
    let ret = value

    for( const fn of functions ) {
      ret = await fn(ret, ...args) as ReturnType<TFunction>
      if( returnFirst && ret !== undefined ) {
        switch( typeof returnFirst ) {
          case 'function': {
            const result = returnFirst(ret)
            if( result !== undefined ) {
              return result
            }
            break
          }

          default: {
            return ret
          }
        }
      }
    }

    return ret
  }
}

