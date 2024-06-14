export type StorageStrategy =
  | 'none'
  | 'memo'
  | 'localStorage'

export type InstanceConfig = {
  publicUrl: string | {
    production: string
    development: string
  }
  storage?: {
    strategy?: StorageStrategy
    namespace?: string
  }
  environment?:
    | 'production'
    | 'development'
  integrated?: boolean
  mirrorPaths?: string[]
}

