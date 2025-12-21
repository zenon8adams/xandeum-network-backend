import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import { BadRequestError, ValidationError } from '@/errors';
import { ZodSchema } from 'zod';

/**
 * Middleware to validate request using express-validator
 * Collects all validation errors and throws a BadRequestError if any exist
 * 
 * @example
 * router.post('/users',
 *   body('email').isEmail(),
 *   body('name').notEmpty(),
 *   validate,
 *   async (req, res) => { ... }
 * );
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => {
      if (err.type === 'field') {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });
    
    throw new BadRequestError(`Validation failed: ${errorMessages.join(', ')}`);
  }
  
  next();
};

/**
 * Higher-order function that combines validation rules with the validate middleware
 * 
 * @example
 * router.post('/users', validateRequest([
 *   body('email').isEmail(),
 *   body('name').notEmpty()
 * ]), async (req, res) => { ... });
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return [...validations, validate];
};

/**
 * Middleware factory to validate request data using Zod schemas
 * Validates body, params, and query separately
 * 
 * @example
 * const schema = z.object({ email: z.string().email(), name: z.string().min(1) });
 * router.post('/users', validateZod({ body: schema }), async (req, res) => { ... });
 */
export const validateZod = (schemas: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validationErrors: Array<{
        field: string;
        message: string;
        code?: string;
      }> = [];

      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const bodyErrors = result.error.issues.map(
            (err: any) => ({
              field: `body.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            })
          );
          validationErrors.push(...bodyErrors);
        } else {
          // Replace with validated data (with defaults, transforms, etc.)
          req.body = result.data;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const paramErrors = result.error.issues.map(
            (err: any) => ({
              field: `params.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            })
          );
          validationErrors.push(...paramErrors);
        } else {
          req.params = result.data as any;
        }
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const queryErrors = result.error.issues.map(
            (err: any) => ({
              field: `query.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            })
          );
          validationErrors.push(...queryErrors);
        } else {
          req.query = result.data as any;
        }
      }

      if (validationErrors.length > 0) {
        throw new ValidationError(
          'Request validation failed',
          validationErrors
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
