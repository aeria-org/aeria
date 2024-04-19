export type InstanceConfig = {
  publicUrl: string | {
    production: string
    development: string
  }
  storage?: {
    strategy?:
      | 'memo'
      | 'localStorage'
    namespace?: string
  }
  integrated?: boolean
}

