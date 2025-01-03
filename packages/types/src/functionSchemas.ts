import { ACError } from './accessControl.js'
import { HTTPStatus } from './http.js'
import { endpointErrorSchema } from './resultSchemas.js'
import { ValidationErrorCode, TraverseError } from './validation.js'

export const insertError = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.UnprocessableContent,
    HTTPStatus.BadRequest,
    HTTPStatus.InternalServerError,
  ],
  code: [
    ACError.InsecureOperator,
    ACError.OwnershipError,
    ACError.ResourceNotFound,
    ACError.TargetImmutable,
    ACError.MalformedInput,
    ACError.UniquenessViolated,
    ValidationErrorCode.EmptyTarget,
    ValidationErrorCode.InvalidProperties,
    ValidationErrorCode.MissingProperties,
    TraverseError.InvalidDocumentId,
    TraverseError.InvalidTempfile,
  ],
})

export const getError = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.BadRequest,
  ],
  code: [
    ACError.ResourceNotFound,
    ACError.OwnershipError,
    ACError.InsecureOperator,
    ACError.MalformedInput,
  ],
})

export const getAllError = () => endpointErrorSchema({
  httpStatus: [HTTPStatus.Forbidden],
  code: [
    ACError.OwnershipError,
    ACError.InsecureOperator,
    ACError.InvalidLimit,
  ],
})

export const countError = () => endpointErrorSchema({
  httpStatus: [HTTPStatus.Forbidden],
  code: [
    ACError.OwnershipError,
    ACError.InvalidLimit,
  ],
})

