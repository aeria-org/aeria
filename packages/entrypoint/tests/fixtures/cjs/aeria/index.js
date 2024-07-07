// @ts-check
const { init } = require('../../../../../server/dist/index.js')
const { createRouter } = require('../../../../../http/dist/index.js')

const router = createRouter()

exports.collections = {
  test: {
    description: {
      $id: 'test',
    },
  },
}

exports.default = init({
  router,
})

