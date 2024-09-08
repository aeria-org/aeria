import type { ApiConfig } from '@aeriajs/types'

export const DEFAULT_API_CONFIG = {
  baseUrl: '/',
  port: 3000,
  defaultPaginationLimit: 10,
  security: {
    paginationLimit: 100,
  },

} satisfies ApiConfig
