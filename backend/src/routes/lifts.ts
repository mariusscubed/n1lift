import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  offerLift,
  findLifts,
  myLifts,
  getLift,
  deleteLift,
  requestLift,
  respondToRequest,
} from '../controllers/liftController';

const router = Router();

// NOTE: /my must be registered before /:id to avoid route conflicts
router.get('/my',               authenticate, myLifts);
router.get('/',                 authenticate, findLifts);
router.post('/',                authenticate, offerLift);
router.get('/:id',              authenticate, getLift);
router.delete('/:id',           authenticate, deleteLift);
router.post('/:id/requests',    authenticate, requestLift);
router.put('/:id/requests/:rid', authenticate, respondToRequest);

export default router;
