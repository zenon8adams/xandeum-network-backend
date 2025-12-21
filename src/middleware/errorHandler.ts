import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  AppError, 
  ValidationError, 
  RPCError, 
  ExternalAPIError, 
  DatabaseError,
  ConfigurationError 
} from '@/errors';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface ErrorResponse {
  status: string;
  message: string;
  stack?: string | undefined;
  errors?: unknown;
  apiName?: string;
  rpcCode?: number;
  operation?: string;
  configKey?: string;
}

/**
 * Send error response in development mode
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ErrorResponse = {
    status: err.status,
    message: err.message,
    // Only include stack in response if specifically requested
    // Stack traces should be logged, not sent to clients
  };

  // Add validation errors if present
  if (err instanceof ValidationError && err.validationErrors) {
    response.errors = err.validationErrors;
  }

  // Add RPC-specific details
  if (err instanceof RPCError) {
    response.rpcCode = err.rpcCode;
    if (err.method) {
      response.errors = { method: err.method, data: err.rpcData };
    }
  }

  // Add API-specific details
  if (err instanceof ExternalAPIError) {
    response.apiName = err.apiName;
  }

  // Add database-specific details
  if (err instanceof DatabaseError) {
    response.operation = err.operation;
  }

  // Add configuration-specific details
  if (err instanceof ConfigurationError && err.configKey) {
    response.configKey = err.configKey;
  }

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  res.status(err.statusCode).json(response);
};

/**
 * Send error response in production mode
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      status: err.status,
      message: err.message,
    };

    // Add validation errors if present (safe to send in production)
    if (err instanceof ValidationError && err.validationErrors) {
      response.errors = err.validationErrors;
    }

    // Add RPC code for client-side error handling
    if (err instanceof RPCError) {
      response.rpcCode = err.rpcCode;
    }

    // Add API name to help with debugging
    if (err instanceof ExternalAPIError) {
      response.apiName = err.apiName;
    }

    logger.error('Operational error:', {
      error: err.message,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('Non-operational error:', {
      error: err.message,
      stack: err.stack,
    });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

/**
 * Handle MongoDB Cast Error (invalid ID format)
 */
const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

/**
 * Handle MongoDB Duplicate Key Error
 */
const handleDuplicateKeyError = (err: any): AppError => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'unknown';
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, StatusCodes.CONFLICT);
};

/**
 * Handle MongoDB Validation Error
 */
const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

/**
 * Handle JWT Error
 */
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again', StatusCodes.UNAUTHORIZED);
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again', StatusCodes.UNAUTHORIZED);
};

/**
 * Global error handling middleware
 * This middleware catches all errors passed to next() and formats them appropriately
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Create a mutable copy of the error
  const error = err instanceof AppError 
    ? err 
    : Object.assign(new AppError(err.message), {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: 'error',
        stack: err.stack
      });

  // Handle specific error types
  let finalError: AppError = error;
  
  if ((err as any).name === 'CastError') {
    finalError = handleCastError(err);
  } else if ((err as any).code === 11000) {
    finalError = handleDuplicateKeyError(err);
  } else if ((err as any).name === 'ValidationError') {
    finalError = handleValidationError(err);
  } else if ((err as any).name === 'JsonWebTokenError') {
    finalError = handleJWTError();
  } else if ((err as any).name === 'TokenExpiredError') {
    finalError = handleJWTExpiredError();
  }

  // Send error response based on environment
  if (config.nodeEnv === 'development') {
    sendErrorDev(finalError, res);
  } else {
    sendErrorProd(finalError, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Cannot find ${_req.originalUrl} on this server`, StatusCodes.NOT_FOUND);
  next(error);
};
