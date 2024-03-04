import { validator, silentValidator } from '../../dist'

export const personCandidate = {
  name: 'Terry',
  age: 50,
}

export const [Person1, personValidator] = validator({
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
})

export const [Person2, personSilentValidator] = silentValidator({
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
})
