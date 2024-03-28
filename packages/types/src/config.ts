import type { RouteContext } from './context'

export type ApiConfig = {
  secret?: string
  apiUrl?: string
  port?: number
  paginationLimit?: number
  database?: {
    mongodbUrl?: string
    noDatabase?: boolean
    logQueries?: boolean
  }
  storage?: {
    fs?: string
    tempFs?: string
  }
  defaultUser?: {
    username: string
    password: string
  }
  allowSignup?: boolean
  signupDefaults?: Partial<{
    roles: string[]
    active: boolean
  }>
  logSuccessfulAuthentications?: boolean
  tokenUserProperties?: string[]
  errorHandler?: <TError extends Error>(
    context: RouteContext,
    error: TError
  )=> any | Promise<any>
}

