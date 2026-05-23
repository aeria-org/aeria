export const isRunningOnCI = () => {
  return process.env.GITHUB_ACTIONS
    || process.env.TRAVIS
    || process.env.CIRCLECI
    || process.env.GITLAB_CI
    || process.env.IS_CI
}

