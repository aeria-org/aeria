export type ServerOptions = {
  host?: string
  port?: number
}

export const defineServerOptions = <TServerOptions extends ServerOptions>(options: TServerOptions) => {
  return options
}

