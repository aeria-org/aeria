import path from 'path'
import * as fs from 'fs/promises'

const DTS_FILENAME = 'aeria.d.ts'

const dts = `// this file will be overwritten
import type {} from '@aeriajs/types'

declare global {
  type UnpackCollections<TCollections> =  {
    [P in keyof TCollections]: TCollections[P] extends infer Candidate
      ? Candidate extends (...args: any[]) => infer Coll
        ? Coll
        : Candidate
      : never
  }

  type Collections = typeof import('.') extends infer EntrypointModule
    ? 'collections' extends keyof EntrypointModule
      ? UnpackCollections<EntrypointModule['collections']>
      : 'default' extends keyof EntrypointModule
        ? EntrypointModule['default'] extends infer Entrypoint
          ? 'options' extends keyof Entrypoint
            ? 'collections' extends keyof Entrypoint['options']
              ? UnpackCollections<Entrypoint['options']['collections']>
              : never
            : never
          : never
        : never
    : never
}

declare module 'aeria' {
  import type { Context } from 'aeria'
  export const useAeria: () => Promise<Context>
  export const aeria: Context
}
//`

const install = async () => {
  const base = process.env.INIT_CWD
  if( !base ) {
    throw new Error('must run as a script')
  }

  const { name } = JSON.parse(await fs.readFile(path.join(base, 'package.json'), {
    encoding: 'utf8',
  }))

  if( name.startsWith('@aeriajs/') || name === 'aeria-monorepo' ) {
    return
  }

  await fs.writeFile(path.join(base, DTS_FILENAME), dts)
}

install()
