// @ts-check
import { init } from '../../../../server/dist/index.js'
import { createRouter } from '../../../../http/dist/index.js'

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

