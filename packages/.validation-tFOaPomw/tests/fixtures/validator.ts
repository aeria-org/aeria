import { validator } from '../../dist/index.js'

export const personCandidate = {
  name: 'Terry',
  age: 50,
}

export const [Person1, personValidator] = validator({
  $id: '',
  required: [
    'name',
    'age',
  ],
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
})

