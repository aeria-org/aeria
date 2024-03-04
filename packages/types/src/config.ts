import type { Context } from './context'

export type ApiConfig = {
  secret?: string
  apiUrl?: string
  port?: number
  paginationLimit?: number
  database?: {
    mongodbUrl?: string
    noDatabase?: boolean
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
    context: Context,
    error: TError
  )=> any | Promise<any>
}

