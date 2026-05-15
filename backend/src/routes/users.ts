import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getUser, updateUserProfile } from '../controllers/userController';

const router = Router();

router.get('/:id',  authenticate, getUser);
router.put('/:id',  authenticate, updateUserProfile);

export default router;
