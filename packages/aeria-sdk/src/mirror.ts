import type { InstanceConfig } from './types'
import path from 'path'
import { deserialize } from '@aeriajs/common'
import { writeFile, mkdir } from 'fs/promises'
import { topLevel } from './topLevel.js'
import { apiUrl } from './utils.js'

const mirrorDts = (mirrorObj: any) => {
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

declare global {
  type Collections = {
    [K in keyof MirrorDescriptions]: {
      item: SchemaWithId<MirrorDescriptions[K]>
    }
  }
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

  type StrongelyTypedTLO = TopLevelObject & Endpoints

  export const url: string
  export const aeria: StrongelyTypedTLO
}
\n`
}

export const runtimeCjs = (config: InstanceConfig) =>
  `const config = ${JSON.stringify(config)}
exports.config = config
exports.url = '${apiUrl(config)}'
exports.aeria = require('aeria-sdk/topLevel').topLevel(config)
exports.storage = require('aeria-sdk/storage').getStorage(config)
\n`

export const runtimeEsm = (config: InstanceConfig) =>
  `import { Aeria, getStorage } from 'aeria-sdk'
export const config = ${JSON.stringify(config)}
export const url = '${apiUrl(config)}'
export const aeria = Aeria(config)
export const storage = getStorage(config)
\n`

export const writeMirrorFiles = async (mirror: any, config: InstanceConfig, filesPath = process.cwd()) => {
  const runtimeBase = path.dirname(require.resolve('aeria-sdk'))

  await mkdir(runtimeBase, {
    recursive: true,
  })

  await writeFile(path.join(filesPath, 'aeria-sdk.d.ts'), mirrorDts(mirror))
  await writeFile(path.join(runtimeBase, 'runtime.js'), runtimeCjs(config))
  await writeFile(path.join(runtimeBase, 'runtime.mjs'), runtimeEsm(config))
}

export const mirrorRemotely = async (config: InstanceConfig) => {
  const api = topLevel(config)

  const mirror = deserialize(await api.describe.POST({
    router: true,
  }))

  return writeMirrorFiles(mirror, config)
}

