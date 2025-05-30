import { extendPersonCollection } from '../.aeria/out/collections/collections.js'
export * from '../.aeria/out/collections/index.js'

export const person = extendPersonCollection({
  functions: {
    hello: (obj: { name: string }) => {
      return {
        message: `Hello, ${obj.name}`,
      }
    },
  },
})

