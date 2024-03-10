import type { ContractWithRoles } from '@aeriajs/types'

export const defineContract = <const TContractWithRoles extends ContractWithRoles>(contract: TContractWithRoles) => {
  return contract
}

