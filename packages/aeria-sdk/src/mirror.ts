import type { InstanceConfig } from './types.js'
import * as path from 'path'
import { deserialize } from '@aeriajs/common'
import { writeFile } from 'fs/promises'
import { createRequire } from 'module'
import { topLevel } from './topLevel.js'
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
  InferResponse,
  SchemaWithId,
  MakeEndpoint,
  RequestMethod,
  CollectionFunctionsSDK

} from '@aeriajs/types'

declare type MirrorDescriptions = ${JSON.stringify(descriptions, null, 2)}\n

declare type MirrorRouter = ${JSON.stringify(router, null, 2)}\n

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
  import { TopLevelObject } from 'aeria-sdk'

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
        ? Fn extends keyof CollectionFunctionsSDK<any>
          ? Record<Coll, Record<
              Fn, {
              POST: CollectionFunctionsSDK<SchemaWithId<MirrorDescriptions[Coll]>>[Fn]
            }
            >>
          : InferEndpoint<Route>
        : InferEndpoint<Route>
      : InferEndpoint<Route>
  } extends infer Endpoints
    ? UnionToIntersection<Endpoints[keyof Endpoints]>
    : never

  type TopLevelAeria = 
    & ((bearerToken?: string) => TopLevelObject & Endpoints)
    & TopLevelObject & Endpoints

  const topLevelAeria: TopLevelAeria

  export const url: string
  export const aeria: TopLevelAeria
  export default topLevelAeria
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
      console.log(`couldn't locate node_modules in "${mirrorPath}"`)
      continue
    }

    const runtimeBase = path.dirname(resolvedPath)

    await writeFile(path.join(mirrorPath, DTS_FILENAME), dts)
    await writeFile(path.join(runtimeBase, 'runtime.js'), cjs)
    await writeFile(path.join(runtimeBase, 'runtime.mjs'), esm)
  }
}

export const mirrorRemotely = async (config: InstanceConfig) => {
  const aeria = topLevel(config)

  const mirror = deserialize<MirrorObject>(await aeria().describe.POST({
    router: true,
  }))

  return writeMirrorFiles(mirror, config)
}

