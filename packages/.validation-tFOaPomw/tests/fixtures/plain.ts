import type { Description } from '@aeriajs/types'

export const plainCandidate = {
  name: 'Terry',
  age: 50,
  job: 'programmer',
}

export const plainDescription = {
  $id: '',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    job: { const: 'programmer' },
  },
} satisfies Description

