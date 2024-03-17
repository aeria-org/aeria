//
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => {
      return /^Version Packages/.test(message)
    }
  ],
}
