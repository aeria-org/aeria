import type { InstanceConfig } from './types.js'
import type { getStorage } from './storage.js'

export const instanceConfig = {} as InstanceConfig
export const url = ''
export const aeria = {}
export const storage = {} as ReturnType<typeof getStorage>

throw new Error('Runtime files werent generated. Run the "aeria-sdk" script first.')
