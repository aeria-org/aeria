export enum ValidationErrorCodes {
  InvalidProperties = 'INVALID_PROPERTIES',
  MissingProperties = 'MISSING_PROPERTIES',
  EmptyTarget = 'EMPTY_TARGET',
}

export type PropertyValidationErrorType =
  | 'missing'
  | 'extraneous'
  | 'unmatching'
  | 'extraneous_element'
  | 'numeric_constraint'

export type PropertyValidationError = {
  type: PropertyValidationErrorType
  index?: number
  details: {
    expected: any
    got: string
  }
}

export type ValidationError =
  | { code: ValidationErrorCodes.InvalidProperties, errors: Record<string, PropertyValidationError | ValidationError> }
  | { code: ValidationErrorCodes.MissingProperties, errors: Record<string, { type: 'missing' }> }
  | { code: ValidationErrorCodes.EmptyTarget, errors: {} }
