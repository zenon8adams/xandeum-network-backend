import { Router } from 'express';
import healthRoutes from './health.routes';
import ipRoutes from './ip.routes';
import pnodeRoutes from './pnode.routes';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/ip', ipRoutes);
router.use('/pnode', pnodeRoutes);

export default router;
