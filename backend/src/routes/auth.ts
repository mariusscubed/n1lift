import { Router } from 'express';
import { socialLogin } from '../controllers/authController';

const router = Router();

/** POST /api/auth/social */
router.post('/social', socialLogin);

export default router;
