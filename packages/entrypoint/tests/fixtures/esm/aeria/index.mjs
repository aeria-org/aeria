// @ts-check
import { init } from '../../../../../server/dist/index.mjs'
import { createRouter } from '../../../../../http/dist/index.mjs'

const router = createRouter()

export const collections = {
  test: {
    description: {
      $id: 'test',
    },
  },
}

export default init({
  router,
})

