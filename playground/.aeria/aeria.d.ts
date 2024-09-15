// this file will be overwritten
import type {} from '@aeriajs/types'

declare global {
  type UnpackCollections<TCollections> =  {
    [P in keyof TCollections]: TCollections[P] extends infer Candidate
      ? Candidate extends (...args: unknown[]) => infer Coll
        ? Coll
        : Candidate
      : never
  }

  type Collections = typeof import('../src/index.ts') extends infer EntrypointModule
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
//