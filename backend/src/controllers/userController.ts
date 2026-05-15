import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { getUserById, updateUser } from '../models/queries';

/**
 * GET /api/users/:id
 */
export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * PUT /api/users/:id
 */
export async function updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.userId !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const updated = await updateUser(req.params.id, req.body);
    if (!updated) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(updated);
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}
