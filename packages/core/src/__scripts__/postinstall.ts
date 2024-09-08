import * as path from 'path'
import * as fs from 'fs'

const DTS_FILENAME = 'aeria.d.ts'

const makeDts = (typesPath: string) => `// this file will be overwritten
import type {} from '@aeriajs/types'

declare global {
  type UnpackCollections<TCollections> =  {
    [P in keyof TCollections]: TCollections[P] extends infer Candidate
      ? Candidate extends (...args: unknown[]) => infer Coll
        ? Coll
        : Candidate
      : never
  }

  type Collections = typeof import('${typesPath}') extends infer EntrypointModule
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
  export const createAeria: () => Promise<Context>
  export const aeria: Context
}
//`

const install = async () => {
  const base = process.env.INIT_CWD || process.cwd()
  const aeriaDir = path.join(base, '.aeria')

  if( !fs.existsSync(aeriaDir) ) {
    await fs.promises.mkdir(aeriaDir)
  }

  const { types = 'src/index.ts' } = JSON.parse(await fs.promises.readFile(path.join(base, 'package.json'), {
    encoding: 'utf8',
  }))

  const dts = makeDts(path.join('..', types).split(path.sep).join('/'))
  await fs.promises.writeFile(path.join(aeriaDir, DTS_FILENAME), dts)
}

install()

