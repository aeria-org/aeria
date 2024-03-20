import { resolve } from 'path'
import * as TJS from 'typescript-json-schema'

const program = TJS.getProgramFromFiles(
  [resolve('src/symbols.ts')],
  {
    paths: {
      '@aeriajs/types': [
        '../types/dist'
      ],
      'mongodb': [
        '../api/node_modules/mongodb'
      ]
    },
  }
)

const schema = TJS.generateSchema(program, 'Description')

console.log(schema)

