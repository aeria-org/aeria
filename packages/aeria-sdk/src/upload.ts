import type { Result, EndpointError, TempId } from '@aeriajs/types'
import type { RequestConfig } from '@aeriajs/common'
import type { FileMetadata, UploadHeaders } from '@aeriajs/core'
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

export const uploader = (config: InstanceConfig) => (bearerToken?: string) => async (collectionName: keyof Collections, params: UploadParams) => {
  const urlParams = {
    name: params.name,
    format: params.format || 'raw',
  } satisfies typeof FileMetadata

  const url = new URL(publicUrl(config))
  url.pathname += `/${collectionName}/upload`

  for( const [paramName, paramValue] of Object.entries(urlParams) ) {
    url.searchParams.set(paramName, paramValue)
  }

  const headers: typeof UploadHeaders & {
    authorization?: `Bearer ${string}`
  } = {
    'x-stream-request': '1',
    'content-type': params.type,
  }

  const requestConfig = {
    params: {
      method: 'POST',
      headers,
    },
  } satisfies RequestConfig

  if( bearerToken ) {
    requestConfig.params.headers.authorization = `Bearer ${bearerToken}`
  }

  const response = await request<Result.Either<EndpointError, TempId>>(
    config,
    url.toString(),
    params.content,
    requestConfig,
  )

  return response.data
}

