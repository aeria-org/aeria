export type EndpointError = {
  httpCode?: number
  code: string
  message: string
  details?: Record<string, any>
}

