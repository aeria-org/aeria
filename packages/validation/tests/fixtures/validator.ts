import { validator } from '../../dist'

export const personCandidate = {
  name: 'Terry',
  age: 50,
}

export const [Person1, personValidator] = validator({
  required: [
    'name',
    'age',
  ],
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
})

