import type { ApiConfig } from '@aeriajs/types'

export const DEFAULT_API_CONFIG = {
  baseUrl: '/',
  defaultPaginationLimit: 10,
  server: {
    port: 3000,
    cors: {
      allowOrigin: ['*'],
      allowMethods: ['*'],
      allowHeaders: [
        'Accept',
        'Accept-Version',
        'Authorization',
        'Content-Length',
        'Content-MD5',
        'Content-Type',
        'Date',
        'X-Api-Version',
        'X-Stream-Request',
      ],
      maxAge: '2592000',
    },
  },
  security: {
    tokenExpiration: 36000,
    linkTokenExpiration: 36000,
    paginationLimit: 100,
    mutableUserProperties: [
      'email',
      'name',
      'password',
      'phone_number',
      'picture_file',
    ],
    revalidateToken: true,
  },
} satisfies ApiConfig

