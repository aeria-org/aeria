export type UserRole =
  | (
    Collections['user']['item']['roles'][number] extends infer UserDefinedRole
      ? UserDefinedRole extends string
        ? `${UserDefinedRole}${UserDefinedRole}` extends UserDefinedRole
          ? 'root'
          : UserDefinedRole
        : never
      : never
  )
  | 'root'
  | 'unauthenticated'

export type AcceptedRole =
  | UserRole
  | UserRole[]
  | null
  | unknown

export type AccessCondition =
  | readonly UserRole[]
  | boolean
  | 'unauthenticated'
  | 'unauthenticated-only'

export type RoleFromAccessCondition<TAccessCondition extends AccessCondition | undefined> = undefined extends TAccessCondition
  ? null
  : number extends keyof TAccessCondition
    ? TAccessCondition[number]
    : TAccessCondition extends true
      ? Exclude<UserRole, 'unauthenticated'>
      : TAccessCondition extends false
        ? never
        : TAccessCondition extends 'unauthenticated-only'
          ? 'unauthenticated'
          : TAccessCondition extends 'unauthenticated'
            ? UserRole
            : never

export enum ACErrors {
  AssetNotFound = 'ASSET_NOT_FOUND',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  AuthorizationError = 'AUTHORIZATION_ERROR',
  FunctionNotFound = 'FUNCTION_NOT_FOUND',
  FunctionNotExposed = 'FUNCTION_NOT_EXPOSED',
  ImmutabilityIncorrectChild = 'IMMUTABILITY_INCORRECT_CHILD',
  ImmutabilityParentNotFound = 'IMMUTABILITY_PARENT_NOT_FOUND',
  ImmutabilityTargetImmutable = 'IMMUTABILITY_TARGET_IMMUTABLE',
  InvalidLimit = 'INVALID_LIMIT',
  OwnershipError = 'OWNERSHIP_ERROR',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
}

export const ACErrorMessages: Record<ACErrors, string> = {
  [ACErrors.AssetNotFound]: 'collection has no registered functions',
  [ACErrors.AuthenticationError]: 'you have insufficient privileges',
  [ACErrors.AuthorizationError]: 'you have insufficient privileges',
  [ACErrors.FunctionNotFound]: 'function not found',
  [ACErrors.FunctionNotExposed]: 'function not exposed',
  [ACErrors.ImmutabilityIncorrectChild]: 'specified limit is invalid',
  [ACErrors.ImmutabilityParentNotFound]: 'specified limit is invalid',
  [ACErrors.ImmutabilityTargetImmutable]: 'specified limit is invalid',
  [ACErrors.InvalidLimit]: 'specified limit is invalid',
  [ACErrors.OwnershipError]: 'you have insufficient privileges',
  [ACErrors.ResourceNotFound]: 'collection not found',
}

