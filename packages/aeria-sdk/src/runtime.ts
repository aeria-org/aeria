import type { InstanceConfig } from './types.js'
import type { getStorage } from './storage.js'
import type { uploader } from './upload.js'

export const instanceConfig = {} as InstanceConfig
export const url = ''
export const aeria = {}
export const upload = {} as ReturnType<typeof uploader>
export const storage = {} as ReturnType<typeof getStorage>
export default aeria

throw new Error("Runtime files weren't generated. Run the \"aeria-sdk\" script first.")
