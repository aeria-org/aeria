export type PipeOptions<TReturn> = {
  returnFirst?: boolean | ((value: unknown)=> Awaited<TReturn> | undefined)
}

export const pipe = <TArgs extends unknown[], TReturn>(functions: ((p1: TReturn, ...args: TArgs)=> TReturn | Promise<TReturn>)[], options?: PipeOptions<TReturn>) => {
  const { returnFirst } = options || {}

  return async (value: Awaited<TReturn>, ...args: TArgs) => {
    let ret = value

    for( const fn of functions ) {
      ret = await fn(ret, ...args)
      // eslint-disable-next-line
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

