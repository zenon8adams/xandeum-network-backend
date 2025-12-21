import { StatusCodes } from 'http-status-codes';
import type { ZodError } from 'zod';

/**
 * Custom application error class that extends the built-in Error class.
 * This allows for consistent error handling across the application.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Operational errors are expected errors we can handle

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error - 400
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

/**
 * Unauthorized Error - 401
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

/**
 * Forbidden Error - 403
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, StatusCodes.CONFLICT);
  }
}

/**
 * Unprocessable Entity Error - 422
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Unprocessable Entity') {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}

/**
 * Too Many Requests Error - 429
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
  }
}

/**
 * Internal Server Error - 500
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Service Unavailable Error - 503
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, StatusCodes.SERVICE_UNAVAILABLE);
  }
}

/**
 * Validation Error - 400
 * Used for schema validation failures with detailed field information
 */
export class ValidationError extends AppError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    code?: string;
  }> | undefined;

  constructor(
    message: string = 'Validation failed',
    validationErrors?: Array<{
      field: string;
      message: string;
      code?: string;
    }> | ZodError
  ) {
    super(message, StatusCodes.BAD_REQUEST);
    
    // If validationErrors is a ZodError, transform it
    if (validationErrors && 'issues' in validationErrors) {
      this.validationErrors = validationErrors.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
    } else {
      this.validationErrors = validationErrors;
    }
  }

  /**
   * Helper to create ValidationError with field prefix
   * Useful for request validation where you want to prefix fields with 'body.', 'params.', etc.
   */
  static fromZodError(
    message: string,
    zodError: ZodError,
    fieldPrefix: string = ''
  ): ValidationError {
    const errors = zodError.issues.map(issue => ({
      field: fieldPrefix ? `${fieldPrefix}.${issue.path.join('.')}` : issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    return new ValidationError(message, errors);
  }
}

/**
 * Configuration Error
 * Used for environment/configuration issues
 */
export class ConfigurationError extends AppError {
  public readonly configKey: string | undefined;

  constructor(message: string = 'Configuration error', configKey?: string) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
    this.configKey = configKey;
  }
}

/**
 * External API Error
 * Used when external API calls fail
 */
export class ExternalAPIError extends AppError {
  public readonly apiName: string;
  public readonly originalError?: unknown;

  constructor(
    apiName: string,
    message: string,
    statusCode: number = StatusCodes.BAD_GATEWAY,
    originalError?: unknown
  ) {
    super(message, statusCode);
    this.apiName = apiName;
    this.originalError = originalError;
  }
}

/**
 * RPC Error
 * Used for JSON-RPC specific errors
 */
export class RPCError extends AppError {
  public readonly rpcCode: number;
  public readonly rpcData?: unknown;
  public readonly method: string | undefined;

  constructor(
    message: string,
    rpcCode: number,
    method?: string,
    rpcData?: unknown
  ) {
    super(message, StatusCodes.BAD_REQUEST);
    this.rpcCode = rpcCode;
    this.method = method;
    this.rpcData = rpcData;
  }
}

/**
 * Database Error
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  public readonly operation: string;
  public readonly originalError?: unknown;

  constructor(message: string, operation: string, originalError?: unknown) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
    this.operation = operation;
    this.originalError = originalError;
  }
}
