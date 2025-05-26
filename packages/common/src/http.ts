export type RequestParams = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export type RequestConfig = {
  params?: RequestParams
  requestTransformer?: RequestTransformer
  responseTransformer?: ResponseTransformer
}

type OmitLastParameter<TFunction> = TFunction extends (...args: [...infer Tail, infer _Head]) => infer Return
  ? (...args: Tail) => Return
  : never

export type RequestTransformer = (url: string, payload: unknown, params: RequestParams, next: (url: string, payload: unknown, params: RequestParams) => ReturnType<RequestTransformer>) => Promise<{
  url: string
  params: RequestParams
}>

export type ResponseTransformer = (response: Awaited<ReturnType<typeof fetch>>, next: (response: Awaited<ReturnType<typeof fetch>>) => ReturnType<ResponseTransformer>) => Promise<Awaited<ReturnType<typeof fetch>>>

export const defaultRequestTransformer: OmitLastParameter<RequestTransformer> = async (url, payload, params) => {
  const request = {
    url,
    params,
  }

  if( payload ) {
    if( params.method === 'GET' || params.method === 'HEAD' ) {
      request.url += `?${new URLSearchParams(payload as ConstructorParameters<typeof URLSearchParams>[0])}`
    } else {
      request.params.body = params.headers?.['content-type']?.startsWith('application/json')
        ? JSON.stringify(payload)
        : payload as Buffer
    }
  }

  return request
}

export const defaultResponseTransformer: OmitLastParameter<ResponseTransformer> = async (response) => {
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
    requestTransformer = (url, payload, params, next) => next(url, payload, params), 
    responseTransformer = (response, next) => next(response),
  } = config

  let params: RequestParams
  if( config.params ) {
    params = config.params
  } else {
    if( payload ) {
      params = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        }
      }
    } else {
      params = {
        method: 'GET',
      }
    }
  }

  const transformedRequest = await requestTransformer(url, payload, params, defaultRequestTransformer)

  const response = await fetch(transformedRequest.url, transformedRequest.params)
  const transformedResponse = await responseTransformer(response, defaultResponseTransformer)

  return transformedResponse as typeof transformedResponse & {
    data: TResponseType
  }
}

