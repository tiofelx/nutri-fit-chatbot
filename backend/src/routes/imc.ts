import { Router } from 'express';
import { z } from 'zod';
import { calculateIMC } from '../services/imcService';
import { validateBody } from '../middleware/validateRequest';

const router = Router();

const IMCRequestSchema = z.object({
  weightKg: z.number().min(20).max(500),
  heightCm: z.number().min(100).max(250),
});

router.post('/', validateBody(IMCRequestSchema), (req, res) => {
  const { weightKg, heightCm } = req.body as z.infer<typeof IMCRequestSchema>;
  const result = calculateIMC(weightKg, heightCm);
  res.json(result);
});

export default router;
