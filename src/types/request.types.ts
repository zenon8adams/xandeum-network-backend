import type { Request, Response, NextFunction } from 'express';

/**
 * Typed request interface that includes validated data
 * This properly types the request after Zod validation
 */
export interface TypedRequest<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = Record<string, unknown>
> extends Omit<Request, 'params' | 'query' | 'body'> {
  params: TParams;
  query: TQuery;
  body: TBody;
}

/**
 * Typed request handler with validated types
 */
export type TypedRequestHandler<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = Record<string, unknown>
> = (
  req: TypedRequest<TParams, TQuery, TBody>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
