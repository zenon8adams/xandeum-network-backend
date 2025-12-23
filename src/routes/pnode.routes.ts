import { Router } from 'express';
import { findBestLeafNodeEndpoint } from '@/controllers/pnode.generative.controller';
import { validateZod, catchAsync } from '@/middleware';
import { findBestLeafNodeEndpointSchema } from '@/validators/generative.validator';
import * as pnodeController from '@/controllers/pnode.controller';
import { batchPodCheckSchema, runCommandQueryCheckSchema, runCommandQueryParamCheckSchema } from '@/validators/pnode.validator';

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

/**
 * @route   GET /api/v1/pnode/run-command/:command
 * @desc    Run a pnode command (get-stats, get-pods, get-pods-with-stats, get-version)
 * @access  Public
 */
router.get(
    '/run-command/:command',
    validateZod({ params: runCommandQueryCheckSchema, query: runCommandQueryParamCheckSchema }), 
    catchAsync(pnodeController.runPnodeCommand)
);

/**
 * @route   POST /api/v1/pnode/generative/find-best-leaf-endpoint
 * @desc    Find the best matching leafNodeInfo.address.endpoint using generative AI
 * @access  Public
 */
router.post(
    '/generative/find-best-leaf-endpoint',
    validateZod({ body: findBestLeafNodeEndpointSchema }),
    catchAsync(findBestLeafNodeEndpoint)
);

export default router;
