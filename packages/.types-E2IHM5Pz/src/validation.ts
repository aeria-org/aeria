export const ValidationErrorCode = {
  InvalidProperties: 'INVALID_PROPERTIES',
  MissingProperties: 'MISSING_PROPERTIES',
  EmptyTarget: 'EMPTY_TARGET',
} as const

export const PropertyValidationErrorCode = {
  Missing: 'MISSING_PROPERTY',
  Extraneous: 'EXTRANEOUS_PROPERTY',
  Unmatching: 'UNMATCHING_PROPERTY',
  ExtraneousElement: 'EXTRANEOUS_ELEMENT',
  MoreItemsExpected: 'MORE_ITEMS_EXPECTED',
  LessItemsExpected: 'LESS_ITEMS_EXPECTED',
  NumericConstraint: 'NUMERIC_CONSTRAINT',
  StringConstraint: 'STRING_CONSTRAINT',
  ReferenceConstraint: 'REFERENCE_CONSTRAINT',
} as const

export const TraverseError = {
  InvalidDocumentId: 'INVALID_DOCUMENT_ID',
  InvalidTempfile: 'INVALID_TEMPFILE',
} as const

export type PropertyValidationError = {
  type: typeof PropertyValidationErrorCode[keyof typeof PropertyValidationErrorCode]
  index?: number
  details?: {
    expected: unknown
    got: unknown
    message?: string
  }
}

export type ValidationErrorInvalidProperties = {
  code: typeof ValidationErrorCode.InvalidProperties
  details: Record<string, PropertyValidationError | ValidationError>
}

export type ValidationErrorMissingProperties = {
  code: typeof ValidationErrorCode.MissingProperties
  details: Record<string, { type: 'missing' }>
}

export type ValidationErrorEmptyTarget = {
  code: typeof ValidationErrorCode.EmptyTarget
  details: {}
}

export type ValidationError =
  | ValidationErrorInvalidProperties
  | ValidationErrorMissingProperties
  | ValidationErrorEmptyTarget

