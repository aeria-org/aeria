export type PipeOptions = {
  returnFirst?: boolean | ((value: any)=> boolean)
}

export const pipe = <TFunction extends (...args: any)=> any>(functions: TFunction[], options?: PipeOptions) => {
  const { returnFirst } = options || {}

  return async (
    value: Parameters<TFunction>[0],
    ...args: Parameters<TFunction> extends [unknown, ...infer Tail] ? Tail : []
  ) => {
    let ret: ReturnType<TFunction> = value

    for( const fn of functions ) {
      ret = await fn(ret, ...args)
      if( returnFirst && ret !== undefined ) {
        switch( typeof returnFirst ) {
          case 'function': {
            const result = returnFirst(ret)
            if( result ) {
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
