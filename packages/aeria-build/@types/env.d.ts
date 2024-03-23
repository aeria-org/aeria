declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      | 'CHECK_TYPES',
      string
    > {}
  }
}

export {}

