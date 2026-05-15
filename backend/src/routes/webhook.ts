import { Router, Request, Response } from 'express';
import { getPool, sql } from '../config/db';
import {
  updateLiftRequest,
  getUserById,
  getLiftById,
} from '../models/queries';
import {
  notifyPassengerConfirmed,
  notifyPassengerDeclined,
  sendTextMessage,
} from '../services/whatsapp';

const router = Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'n1lift_verify';

// ─── Webhook verification (Meta GET challenge) ────────────────────────────────
/**
 * GET /api/webhooks/whatsapp
 * Meta calls this endpoint to verify the webhook URL during setup.
 */
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

// ─── Inbound message handler ──────────────────────────────────────────────────
/**
 * POST /api/webhooks/whatsapp
 * Receives inbound WhatsApp messages from Meta.
 * Handles YES / NO replies from drivers to accept or decline lift requests.
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  // Always acknowledge immediately (Meta requires 200 within 5 s)
  res.sendStatus(200);

  try {
    const entry   = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    if (value?.statuses) return; // delivery / read receipts — ignore

    const messages = value?.messages;
    if (!messages?.length) return;

    for (const msg of messages) {
      if (msg.type !== 'text') continue;

      const fromPhone = msg.from;                        // e.g. "447700900000"
      const body      = (msg.text?.body || '').trim().toUpperCase();

      // Extract request ID from context (we embed it in the ref line)
      // Format expected in driver reply: YES <requestId> or NO <requestId>
      // If no ID provided, look up the oldest pending request for this driver.
      const parts     = body.split(' ');
      const reply     = parts[0];          // YES or NO
      const requestId = parts[1] || null;

      if (reply !== 'YES' && reply !== 'NO') {
        await sendTextMessage(
          fromPhone,
          `Reply *YES <RequestID>* to confirm or *NO <RequestID>* to decline a ride request.\nFind the RequestID in the original notification message.`
        );
        continue;
      }

      if (!requestId) {
        await sendTextMessage(fromPhone, `Please include the request reference. Example: YES ABC123`);
        continue;
      }

      // Look up the request
      const pool = getPool();
      const reqResult = await pool
        .request()
        .input('id', sql.UniqueIdentifier, requestId)
        .query(
          `SELECT lr.*, l.from_address, l.to_address, l.departure_time,
                  l.driver_id, l.id AS lift_id
           FROM LiftRequests lr
           JOIN Lifts l ON l.id = lr.lift_id
           WHERE lr.id = @id`
        );

      const liftRequest = reqResult.recordset[0];
      if (!liftRequest) {
        await sendTextMessage(fromPhone, `Could not find request ${requestId}. Please check the reference and try again.`);
        continue;
      }

      const status: 'confirmed' | 'declined' = reply === 'YES' ? 'confirmed' : 'declined';
      await updateLiftRequest(liftRequest.lift_id, requestId, status);

      // Notify the passenger
      const passenger = await getUserById(liftRequest.passenger_id);
      const driver    = await getUserById(liftRequest.driver_id);
      const lift      = await getLiftById(liftRequest.lift_id);

      if (passenger?.phone_number && driver && lift) {
        const departureTime = new Date(lift.departure_time).toLocaleString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        });

        if (status === 'confirmed') {
          await notifyPassengerConfirmed({
            passengerPhone: passenger.phone_number,
            driverName:     driver.display_name,
            fromAddress:    lift.from_address,
            toAddress:      lift.to_address,
            departureTime,
            driverPhone:    driver.phone_number || '',
          });
        } else {
          await notifyPassengerDeclined({
            passengerPhone: passenger.phone_number,
            driverName:     driver.display_name,
            departureTime,
          });
        }
      }

      // Confirm back to driver
      await sendTextMessage(
        fromPhone,
        status === 'confirmed'
          ? `✅ Ride confirmed! The passenger has been notified.`
          : `❌ Request declined. The passenger has been notified.`
      );
    }
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }
});

export default router;
