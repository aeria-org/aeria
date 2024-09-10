import type { UserRole } from './token.js'

export type AccessCondition =
  | readonly UserRole[]
  | boolean
  | 'unauthenticated'
  | 'unauthenticated-only'

export type RoleFromAccessCondition<TAccessCondition extends AccessCondition | undefined> = undefined extends TAccessCondition
  ? null
  : TAccessCondition extends readonly (infer Role)[]
    ? Role
    : TAccessCondition extends true
      ? Exclude<UserRole, 'unauthenticated'>
      : TAccessCondition extends false
        ? never
        : TAccessCondition extends 'unauthenticated-only'
          ? 'unauthenticated'
          : TAccessCondition extends 'unauthenticated'
            ? UserRole
            : never

export enum ACError {
  AuthenticationError = 'AUTHENTICATION_ERROR',
  AuthorizationError = 'AUTHORIZATION_ERROR',
  FunctionNotFound = 'FUNCTION_NOT_FOUND',
  FunctionNotExposed = 'FUNCTION_NOT_EXPOSED',
  TargetImmutable = 'TARGET_IMMUTABLE',
  InvalidLimit = 'INVALID_LIMIT',
  OwnershipError = 'OWNERSHIP_ERROR',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  InsecureOperator = 'INSECURE_OPERATOR',
  MalformedInput = 'MALFORMED_INPUT',
  UnknownError = 'UNKNOWN_ERROR',
}

