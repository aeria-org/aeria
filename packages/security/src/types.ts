import type { Result, ACError, CollectionProps } from '@aeriajs/types'

export type ReadMiddlewareReturn<TProps extends CollectionProps<unknown>> = Promise<
  Result.Either<
    | ACError.OwnershipError
    | ACError.InvalidLimit,
    TProps
  >
>

export type WriteMiddlewareReturn<TProps extends CollectionProps<unknown>> = Promise<
  Result.Either<
    | ACError.OwnershipError
    | ACError.ResourceNotFound
    | ACError.TargetImmutable,
    TProps
  >
>

