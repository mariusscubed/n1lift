import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import {
  createLift,
  searchLifts,
  getLiftById,
  getMyLifts,
  cancelLift,
  createLiftRequest,
  updateLiftRequest,
} from '../models/queries';

/** POST /api/lifts */
export async function offerLift(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lift = await createLift({ ...req.body, driver_id: req.userId! });
    res.status(201).json(lift);
  } catch (err) {
    console.error('offerLift error:', err);
    res.status(500).json({ error: 'Failed to create lift' });
  }
}

/** GET /api/lifts?from_lat=&from_lng=&to_lat=&to_lng=&date=&seats= */
export async function findLifts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from_lat, from_lng, to_lat, to_lng, date, seats } = req.query as Record<string, string>;
    const lifts = await searchLifts({
      from_lat: parseFloat(from_lat),
      from_lng: parseFloat(from_lng),
      to_lat:   parseFloat(to_lat),
      to_lng:   parseFloat(to_lng),
      date,
      seats:    parseInt(seats || '1', 10),
    });
    res.json(lifts);
  } catch (err) {
    console.error('findLifts error:', err);
    res.status(500).json({ error: 'Failed to search lifts' });
  }
}

/** GET /api/lifts/my */
export async function myLifts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await getMyLifts(req.userId!);
    res.json(data);
  } catch (err) {
    console.error('myLifts error:', err);
    res.status(500).json({ error: 'Failed to fetch your lifts' });
  }
}

/** GET /api/lifts/:id */
export async function getLift(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lift = await getLiftById(req.params.id);
    if (!lift) { res.status(404).json({ error: 'Lift not found' }); return; }
    res.json(lift);
  } catch (err) {
    console.error('getLift error:', err);
    res.status(500).json({ error: 'Failed to fetch lift' });
  }
}

/** DELETE /api/lifts/:id */
export async function deleteLift(req: AuthRequest, res: Response): Promise<void> {
  try {
    await cancelLift(req.params.id, req.userId!);
    res.json({ message: 'Lift cancelled' });
  } catch (err) {
    console.error('deleteLift error:', err);
    res.status(500).json({ error: 'Failed to cancel lift' });
  }
}

/** POST /api/lifts/:id/requests */
export async function requestLift(req: AuthRequest, res: Response): Promise<void> {
  try {
    const request = await createLiftRequest(req.params.id, req.userId!);
    res.status(201).json(request);
  } catch (err) {
    console.error('requestLift error:', err);
    res.status(500).json({ error: 'Failed to request lift' });
  }
}

/** PUT /api/lifts/:id/requests/:rid */
export async function respondToRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = req.body as { status: 'confirmed' | 'declined' };
    await updateLiftRequest(req.params.id, req.params.rid, status);
    res.json({ message: `Request ${status}` });
  } catch (err) {
    console.error('respondToRequest error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
}
