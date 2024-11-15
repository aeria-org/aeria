export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    () => {
      return !!process.env.GITHUB_ACTIONS
    }
  ],
}
