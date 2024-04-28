import type { ApiConfig } from '@aeriajs/types'

export const DEFAULT_API_CONFIG = {
  baseUrl: '/',
  port: 3000,
  paginationLimit: 10,
  security: {},

} satisfies ApiConfig
