export type RequestParams = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export type RequestConfig = {
  params?: RequestParams
  requestTransformer?: (...args: Parameters<typeof defaultRequestTransformer>)=> Promise<{
    url: string
    params: RequestParams
  }>
  responseTransformer?: typeof defaultResponseTransformer
}

export const defaultRequestTransformer = async (url: string, payload: unknown, params: RequestParams) => {
  const request: {
    url: string
    params: RequestParams
  } = {
    url,
    params,
  }

  if( typeof payload === 'string' ) {
    if( params.method === 'GET' || params.method === 'HEAD' ) {
      request.url += `?${new URLSearchParams(payload)}`
    } else {
      request.params.body = params.headers?.['content-type']?.startsWith('application/json')
        ? JSON.stringify(payload)
        : payload
    }
  }

  return request
}

export const defaultResponseTransformer = async (response: Awaited<ReturnType<typeof fetch>>) => {
  const result = response as Awaited<ReturnType<typeof fetch>> & {
    data: unknown
  }

  result.data = await response.text()

  if( response.headers.get('content-type')?.startsWith('application/json') ) {
    result.data = JSON.parse(String(result.data))
  }

  return result
}

export const request = async <TResponseType = unknown>(
  url: string,
  payload?: unknown,
  config: RequestConfig = {},
) => {
  const {
    requestTransformer = defaultRequestTransformer,
    responseTransformer = defaultResponseTransformer,
    params = {
      method: payload
        ? 'POST'
        : 'GET',
      headers: payload
        ? {
          'content-type': 'application/json',
        }
        : {},
    },
  } = config

  const transformedRequest = await requestTransformer(url, payload, params)

  const response = await fetch(transformedRequest.url, transformedRequest.params)
  const transformedResponse = await responseTransformer(response)

  return transformedResponse as typeof transformedResponse & {
    data: TResponseType
  }
}

