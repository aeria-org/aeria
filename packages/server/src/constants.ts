import type { ApiConfig } from '@aeriajs/types'

export const DEFAULT_API_CONFIG = {
  baseUrl: '/',
  port: 3000,
  defaultPaginationLimit: 10,
  security: {
    tokenExpiration: 36000,
    linkTokenExpiration: 36000,
    paginationLimit: 100,
    signupRequired: [
      'name',
      'email',
    ],
    mutableUserProperties: [
      'email',
      'name',
      'password',
      'phone_number',
      'picture_file',
    ],
  },

} satisfies ApiConfig
