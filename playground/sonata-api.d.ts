// this file will be overwritten
import type {} from 'aeria'

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
//
