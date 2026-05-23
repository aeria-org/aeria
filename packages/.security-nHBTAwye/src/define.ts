import type { SecurityPolicy } from '@aeriajs/types'

export const defineSecurityPolicy = <const TSecurityPolicy extends SecurityPolicy>(policy: TSecurityPolicy) => {
  return policy
}
