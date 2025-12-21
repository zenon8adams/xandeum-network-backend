import { Router } from 'express';
import { catchAsync, validateZod } from '@/middleware';
import * as pnodeController from '@/controllers/pnode.controller';
import { batchPodCheckSchema } from '@/validators/pnode.validator';

const router = Router();

/**
 * @route   POST /api/v1/pnode/check-batch
 * @desc    Batch check pod accessibility and store results
 * @access  Public
 */
router.post(
  '/check-batch',
  validateZod({ body: batchPodCheckSchema }),
  catchAsync(pnodeController.batchCheckPodAccessibility)
);

/**
 * @route   GET /api/v1/pnode/accessibility/:podId
 * @desc    Get cached pod accessibility status
 * @access  Public
 */
router.get('/accessibility/:podId', catchAsync(pnodeController.getCachedPodAccessibility));

/**
 * @route   GET /api/v1/pnode/root
 * @desc    Get aggregated root node information
 * @access  Public
 */
router.get('/root', catchAsync(pnodeController.getRootNodeInfo));

/**
 * @route   GET /api/v1/pnode/leaf/
 * @desc    Get leaf nodes information
 * @access  Public
 */
router.get('/leaf', catchAsync(pnodeController.getLeafNodesInfo));

export default router;
