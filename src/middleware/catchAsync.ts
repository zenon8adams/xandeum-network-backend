import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Generic async request handler that can work with any request type
 */
export type AsyncRequestHandler<TReq = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps async route handlers to catch errors and pass them to the error handling middleware
 * This eliminates the need for try-catch blocks in every route handler
 * Works with both regular Request and TypedRequest types
 * 
 * @example
 * router.get('/users', catchAsync(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const catchAsync = <TReq = Request>(
  fn: AsyncRequestHandler<TReq>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
};
