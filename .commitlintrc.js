export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => {
      return ['Version Packages'].includes(message)
    }
  ],
}
