import { Router } from 'express';
import tripRoutes from './trip.routes.js';
import authRoutes from './auth.routes.js';
import geoRoutes from './geo.routes.js';
import { getEnvStatus } from '../config/env.js';
import { isDBConnected } from '../config/database.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'BonVoyage AI API',
    timestamp: new Date().toISOString(),
    env: getEnvStatus(),
    dbConnected: isDBConnected(),
  });
});

router.get('/health/apis', async (_req, res, next) => {
  try {
    const { runApiDiagnostics } = await import('../services/diagnostics.service.js');
    const results = await runApiDiagnostics();
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
});

router.use('/auth', authRoutes);
router.use('/trip', tripRoutes);
router.use('/geo', geoRoutes);

export default router;
