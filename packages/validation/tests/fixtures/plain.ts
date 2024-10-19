import type { Description } from '@aeriajs/types'

export const plainCandidate = {
  name: 'Terry',
  age: 50,
  job: 'programmer',
}

export const plainDescription = {
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    job: { const: 'programmer' },
  },
} satisfies Omit<Description, '$id'>

