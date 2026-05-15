import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../config/db';
import { findUserByProvider, createUser } from '../models/queries';
import { sendOTP } from '../services/whatsapp';

const router = Router();

/** In-memory OTP store (use Redis in production) */
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

/**
 * POST /api/auth/otp/send
 * Sends a WhatsApp OTP to the supplied phone number.
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as { phone: string };
    if (!phone) { res.status(400).json({ error: 'phone is required' }); return; }

    const otp       = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(phone, { otp, expiresAt });

    await sendOTP(phone, otp);
    res.json({ message: 'OTP sent via WhatsApp' });
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/otp/verify
 * Verifies the OTP and returns a JWT.
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };
    if (!phone || !otp) { res.status(400).json({ error: 'phone and otp are required' }); return; }

    const stored = otpStore.get(phone);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    otpStore.delete(phone);

    // Upsert user by phone
    let user = await findUserByProvider('whatsapp', phone);
    if (!user) {
      user = await createUser({
        provider:     'whatsapp',
        provider_id:  phone,
        display_name: phone,
        email:        '',
        avatar_url:   '',
      });
      // Store phone number
      const pool = getPool();
      await pool
        .request()
        .input('id',    sql.UniqueIdentifier, user.id)
        .input('phone', sql.NVarChar(20),      phone)
        .query(`UPDATE Users SET phone_number = @phone WHERE id = @id`);
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({ token, user });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

export default router;
