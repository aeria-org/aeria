import type { InstanceConfig, AeriaInstance } from './types.js'
import { deserialize } from '@aeriajs/common'
import * as path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'module'
import { createInstance } from './instance.js'
import { publicUrl } from './utils.js'

const DTS_FILENAME = 'aeria-sdk.d.ts'

type MirrorObject = {
  descriptions: unknown
  router?: unknown
}

const mirrorDts = (mirrorObj: MirrorObject, config: InstanceConfig) => {
  const {
    descriptions,
    router,
  } = mirrorObj

  return `import type {
  InferProperty,
  InferProperties,
  SchemaWithId,
  PackReferences,
  RequestMethod,
  CollectionFunctionsSDK

} from '@aeriajs/types'

declare type MirrorDescriptions = ${JSON.stringify(descriptions, null, 2)}\n

declare type MirrorApiSchema = ${JSON.stringify(router, null, 2)}\n

${
  config.integrated
    ? ''
    : `declare global {
  type Collections = {
    [K in keyof MirrorDescriptions]: {
      item: SchemaWithId<MirrorDescriptions[K]>
    }
  }
}\n`
}
declare module 'aeria-sdk' {
  import { AeriaInstance, MakeEndpoint } from 'aeria-sdk'

  type UnionToIntersection<T> = (T extends unknown ? ((x: T) => 0) : never) extends ((x: infer R) => 0)
    ? R
    : never

  type InferEndpoints<TApiSchema extends ApiSchema, TRoute extends keyof TApiSchema> = {
    [Method in keyof TApiSchema[TRoute]]: Method extends RequestMethod
      ? TApiSchema[TRoute][Method] extends infer Contract
        ? Contract extends
        | { response: infer RouteResponse }
        | { payload: infer RoutePayload  }
        | { query: infer RoutePayload  }
          ? MakeEndpoint<
            TRoute,
            Method,
            InferProperties<RouteResponse>,
            RoutePayload extends {}
              ? PackReferences<InferProperty<RoutePayload>>
              : undefined
          >
          : MakeEndpoint<TRoute, Method>
        : never
      : never
    } extends infer Methods
      ? Methods[keyof Methods]
      : never

  export type Api = {
    [Route in keyof MirrorApiSchema]: Route extends \`/\${infer Coll}/\${infer Fn}\`
      ? Coll extends keyof Collections
        ? Fn extends keyof CollectionFunctionsSDK
          ? Record<Coll, Record<
              Fn, {
              POST: CollectionFunctionsSDK<MirrorDescriptions[Coll]>[Fn]
            }
            >>
          : InferEndpoints<Route>
        : InferEndpoints<Route>
      : InferEndpoints<Route>
  } extends infer Api
    ? UnionToIntersection<Api[keyof Api]>
    : never

  type TopLevelAeria = 
    & ((bearerToken?: string) => AeriaInstance & Api)
    & AeriaInstance & Api

  const topLevelAeria: TopLevelAeria

  export {
    MirrorDescriptions,
    MirrorApiSchema,
  }

  export const url: string
  export const aeria: TopLevelAeria
  export default topLevelAeria
}
\n`
}

export const runtimeCjs = (config: InstanceConfig) =>
  `const config = ${JSON.stringify(config)}
const aeria = require('./instance.js').createInstance(config)
exports.instanceConfig = config
exports.url = '${publicUrl(config)}'
exports.aeria = aeria
exports.storage = require('./storage.js').getStorage(config)
exports.upload = require('./upload.js').uploader(config)
exports.default = aeria
\n`

export const runtimeEsm = (config: InstanceConfig) =>
  `import { createInstance } from './instance.mjs'
import { getStorage } from './storage.mjs'
import { uploader } from './upload.mjs'
export const instanceConfig = ${JSON.stringify(config)}
export const url = '${publicUrl(config)}'
export const aeria = createInstance(instanceConfig)
export const storage = getStorage(instanceConfig)
export const upload = uploader(instanceConfig)
export default aeria
\n`

export const writeMirrorFiles = async (mirror: MirrorObject, config: InstanceConfig) => {
  const mirrorPaths = config.mirrorPaths || ['.aeria']
    .map((mirrorPath) => path.join(process.cwd(), mirrorPath))

  const dts = mirrorDts(mirror, config)
  const cjs = runtimeCjs(config)
  const esm = runtimeEsm(config)

  for( const mirrorPath of mirrorPaths ) {
    const syntheticRequire = createRequire(path.join(path.dirname(path.resolve(mirrorPath)), 'node_modules'))

    let resolvedPath: string
    try {
      resolvedPath = syntheticRequire.resolve('aeria-sdk')
    } catch( err ) {
      console.warn(`couldn't locate node_modules in "${mirrorPath}"`)
      continue
    }

    const runtimeBase = path.dirname(resolvedPath)

    await writeFile(path.join(mirrorPath, DTS_FILENAME), dts)
    // this array join must be used, otherwise the .js will be transformed by the transform-import-extensions script
    await writeFile(path.join(runtimeBase, [
      'runtime',
      'js',
    ].join('.')), cjs)
    await writeFile(path.join(runtimeBase, [
      'runtime',
      'mjs',
    ].join('.')), esm)
  }
}

export const mirrorRemotely = async (config: InstanceConfig) => {
  const aeria = createInstance<AeriaInstance>(config)
  const mirror = deserialize<MirrorObject>(await aeria().describe.POST({
    router: true,
  }))

  return writeMirrorFiles(mirror, config)
}

