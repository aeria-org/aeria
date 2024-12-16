import type { Result, EndpointError, TempId } from '@aeriajs/types'
import type { RequestConfig } from '@aeriajs/common'
import type { InstanceConfig } from './types.js'
import { request } from './http.js'
import { publicUrl } from './utils.js'

type UploadParams = {
  name: string
  type: string
  content: unknown
  format?:
    | 'raw'
    | 'base64'
}

export const uploader = (config: InstanceConfig) => (bearerToken?: string) => async (collectionName: string, params: UploadParams) => {
  const url = `${publicUrl(config)}/${collectionName}/upload?name=${params.name}&format=${params.format || 'raw' satisfies UploadParams['format']}`

  const requestConfig = {
    params: {
      headers: {
        'x-stream-request': '1',
        'content-type': params.type,
      } as Record<string, string>,
    }
  } satisfies RequestConfig

  if( bearerToken ) {
    requestConfig.params.headers.authorization = `Bearer ${bearerToken}`
  }

  const response = await request<Result.Either<EndpointError, TempId>>(
    config,
    url,
    params.content,
    requestConfig,
  )

  return response.data
}

