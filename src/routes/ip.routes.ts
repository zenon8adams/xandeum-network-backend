import { Router } from 'express';
import { catchAsync, validateZod } from '@/middleware';
import { getIpInfoByQuery, batchLookupIps } from '@/controllers/ip.controller';
import { ipQuerySchema, batchIpSchema } from '@/validators/ip.validator';

const router = Router();

/**
 * GET /ip/lookup?ip=x.x.x.x - Lookup IP address information via query param
 */
router.get('/lookup', validateZod({ query: ipQuerySchema }), catchAsync(getIpInfoByQuery));

/**
 * POST /ip/batch - Batch lookup multiple IP addresses
 * Stores results in MongoDB for permanent caching
 */
router.post('/batch', validateZod({ body: batchIpSchema }), catchAsync(batchLookupIps));

export default router;
