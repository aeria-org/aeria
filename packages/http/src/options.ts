export type ServerOptions = {
  host?: string
  port?: number
}

export const defineServerOptions = (options?: ServerOptions): ServerOptions => {
  const {
    host = '0.0.0.0',
    port = 3000,
  } = options || {}

  return {
    host,
    port,
  }
}

