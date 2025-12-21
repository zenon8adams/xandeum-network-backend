import { Router, type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
