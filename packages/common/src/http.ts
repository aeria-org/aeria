export type RequestParams = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export type RequestConfig = {
  params?: RequestParams
  requestTransformer?: RequestTransformer
  responseTransformer?: ResponseTransformer
}

export type RequestTransformerContext = {
  url: string
  payload: unknown
  params: RequestParams
}

export type ResponseTransformerContext = {
  response: Awaited<ReturnType<typeof fetch>>
}

export type RequestTransformerNext = (context: RequestTransformerContext) => ReturnType<RequestTransformer>
export type ResponseTransformerNext = (context: ResponseTransformerContext) => ReturnType<ResponseTransformer>
export type RequestTransformer = (context: RequestTransformerContext, next: RequestTransformerNext) => Promise<RequestTransformerContext>
export type ResponseTransformer = (context: ResponseTransformerContext, next: ResponseTransformerNext) => Promise<ResponseTransformerContext>

export const defaultRequestTransformer: RequestTransformerNext = async (context) => {
  if( context.payload ) {
    if( context.params.method === 'GET' || context.params.method === 'HEAD' ) {
      context.url += `?${new URLSearchParams(context.payload as ConstructorParameters<typeof URLSearchParams>[0])}`
    } else {
      context.params.body = context.params.headers?.['content-type']?.startsWith('application/json')
        ? JSON.stringify(context.payload)
        : context.payload as Buffer
    }
  }

  return context
}

export const defaultResponseTransformer: ResponseTransformerNext = async (context) => {
  const result = context.response as Awaited<ReturnType<typeof fetch>> & {
    data: unknown
  }

  result.data = await context.response.text()
  if( context.response.headers.get('content-type')?.startsWith('application/json') ) {
    result.data = JSON.parse(String(result.data))
  }

  context.response = result
  return context
}

export const request = async <TResponseType = unknown>(
  url: string,
  payload?: unknown,
  config: RequestConfig = {},
) => {
  const {
    requestTransformer = (context, next) => next(context),
    responseTransformer = (context, next) => next(context),
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
        },
      }
    } else {
      params = {
        method: 'GET',
      }
    }
  }

  const transformedRequest = await requestTransformer({
    url,
    payload,
    params,
  }, defaultRequestTransformer)

  const response = await fetch(transformedRequest.url, transformedRequest.params)
  const { response: transformedResponse } = await responseTransformer({
    response,
  }, defaultResponseTransformer)

  return transformedResponse as typeof transformedResponse & {
    data: TResponseType
  }
}

