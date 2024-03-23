declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      | 'AERIA_MAIN',
      string | undefined
    > {}
  }
}

export {}

