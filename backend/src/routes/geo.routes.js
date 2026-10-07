import { Router } from 'express';
import { detectCurrencyFromRequest } from '../services/geo.service.js';

const router = Router();

router.get('/currency', async (req, res, next) => {
  try {
    const result = await detectCurrencyFromRequest(req);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
