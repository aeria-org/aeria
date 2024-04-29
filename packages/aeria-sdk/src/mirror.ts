import type { InstanceConfig } from './types'
import path from 'path'
import { deserialize } from '@aeriajs/common'
import { writeFile, mkdir } from 'fs/promises'
import { topLevel } from './topLevel.js'
import { publicUrl } from './utils.js'

const mirrorDts = (mirrorObj: any, config: InstanceConfig) => {
  const collections = mirrorObj.descriptions

  return `import type {
  InferProperty,
  InferResponse,
  SchemaWithId,
  MakeEndpoint,
  RequestMethod,
  CollectionFunctionsPaginated

} from '@aeriajs/types'

declare type MirrorDescriptions = ${JSON.stringify(collections, null, 2)}\n

declare type MirrorRouter = ${JSON.stringify(mirrorObj.router, null, 2)}\n

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
  import { TopLevelObject, TLOFunctions } from 'aeria-sdk'

  type UnionToIntersection<T> = (T extends any ? ((x: T) => 0) : never) extends ((x: infer R) => 0)
    ? R
    : never

  type InferEndpoint<Route extends keyof MirrorRouter> = {
    [Method in keyof MirrorRouter[Route]]: Method extends RequestMethod
      ? MirrorRouter[Route][Method] extends infer Contract
        ? Contract extends
        | { response: infer RouteResponse }
        | { payload: infer RoutePayload  }
        | { query: infer RoutePayload  }
          ? MakeEndpoint<
            Route,
            Method,
            InferResponse<RouteResponse>,
            RoutePayload extends {}
              ? InferProperty<RoutePayload>
              : undefined
          >
          : MakeEndpoint<Route, Method>
        : never
      : never
    } extends infer Methods
      ? Methods[keyof Methods]
      : never

  type Endpoints = {
    [Route in keyof MirrorRouter]: Route extends \`/\${infer Coll}/\${infer Fn}\`
      ? Coll extends keyof Collections
        ? Fn extends keyof CollectionFunctionsPaginated<any>
          ? Record<Coll, Record<
              Fn, {
              POST: CollectionFunctionsPaginated<SchemaWithId<MirrorDescriptions[Coll]>>[Fn]
            }
            >>
          : InferEndpoint<Route>
        : InferEndpoint<Route>
      : InferEndpoint<Route>
  } extends infer Endpoints
    ? UnionToIntersection<Endpoints[keyof Endpoints]>
    : never

  type TopLevelFunction = (bearerToken?: string) => TopLevelObject & Endpoints
  declare const aeria: TopLevelFunction

  export const url: string
  export const aeria: TopLevelFunction
  export default aeria
}
\n`
}

export const runtimeCjs = (config: InstanceConfig) =>
  `const config = ${JSON.stringify(config)}
const aeria = require('./topLevel.js').topLevel(config)
exports.config = config
exports.url = '${publicUrl(config)}'
exports.aeria = aeria
exports.storage = require('./storage.js').getStorage(config)
exports.default = aeria
\n`

export const runtimeEsm = (config: InstanceConfig) =>
  `import { topLevel } from './topLevel.mjs'
import { getStorage } from './storage.mjs'
export const config = ${JSON.stringify(config)}
export const url = '${publicUrl(config)}'
export const aeria = topLevel(config)
export const storage = getStorage(config)
export default aeria
\n`

export const writeMirrorFiles = async (mirror: any, config: InstanceConfig, filesPath = process.cwd()) => {
  const runtimeBase = path.dirname(require.resolve('aeria-sdk'))

  await mkdir(runtimeBase, {
    recursive: true,
  })

  await writeFile(path.join(filesPath, 'aeria-sdk.d.ts'), mirrorDts(mirror, config))
  await writeFile(path.join(runtimeBase, 'runtime.js'), runtimeCjs(config))
  await writeFile(path.join(runtimeBase, 'runtime.mjs'), runtimeEsm(config))
}

export const mirrorRemotely = async (config: InstanceConfig) => {
  const aeria = topLevel(config)

  const mirror = deserialize(await aeria().describe.POST({
    router: true,
  }))

  return writeMirrorFiles(mirror, config)
}

