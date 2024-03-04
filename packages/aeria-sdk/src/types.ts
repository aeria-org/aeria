export type InstanceConfig = {
  apiUrl: string | {
    production: string
    development: string
  }
  storage?: {
    strategy?:
      | 'memo'
      | 'localStorage'
    namespace?: string
  }
}

