import axios from 'axios';

/**
 * Meta WhatsApp Cloud API service.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * All outbound messages are sent via the Meta Graph API.
 * Inbound messages arrive via a webhook (see routes/webhook.ts).
 */

const META_API_VERSION = 'v19.0';
const PHONE_NUMBER_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN      = process.env.WHATSAPP_ACCESS_TOKEN    || '';

const metaClient = axios.create({
  baseURL: `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// ─── Generic sender ──────────────────────────────────────────────────────────

/**
 * Send a free-form text message (only valid within 24-hour customer window).
 */
export async function sendTextMessage(to: string, body: string): Promise<void> {
  await metaClient.post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });
}

// ─── OTP / Phone verification ─────────────────────────────────────────────────

/**
 * Send a one-time PIN to verify a user's WhatsApp number.
 * Uses a plain text message; swap for an approved template in production.
 */
export async function sendOTP(to: string, otp: string): Promise<void> {
  await sendTextMessage(
    to,
    `Your N1Lift verification code is *${otp}*. Valid for 10 minutes. Do not share this code.`
  );
}

// ─── Lift notification templates ─────────────────────────────────────────────

/**
 * Notify a driver that a passenger has requested to join their lift.
 * Driver can reply YES or NO.
 */
export async function notifyDriverOfRequest(params: {
  driverPhone:    string;
  passengerName:  string;
  fromAddress:    string;
  toAddress:      string;
  departureTime:  string;  // e.g. "Mon 19 May at 07:30"
  requestId:      string;
}): Promise<void> {
  const message =
    `🚗 *N1Lift – New Ride Request*\n\n` +
    `*${params.passengerName}* wants to join your lift:\n` +
    `📍 From: ${params.fromAddress}\n` +
    `📍 To:   ${params.toAddress}\n` +
    `🕐 Departure: ${params.departureTime}\n\n` +
    `Reply *YES* to confirm or *NO* to decline.\n` +
    `_(Ref: ${params.requestId})_`;

  await sendTextMessage(params.driverPhone, message);
}

/**
 * Notify a passenger that their request was confirmed.
 */
export async function notifyPassengerConfirmed(params: {
  passengerPhone: string;
  driverName:     string;
  fromAddress:    string;
  toAddress:      string;
  departureTime:  string;
  driverPhone:    string;
}): Promise<void> {
  const message =
    `✅ *N1Lift – Ride Confirmed!*\n\n` +
    `*${params.driverName}* has confirmed your lift:\n` +
    `📍 From: ${params.fromAddress}\n` +
    `📍 To:   ${params.toAddress}\n` +
    `🕐 Departure: ${params.departureTime}\n\n` +
    `Driver's WhatsApp: wa.me/${params.driverPhone.replace('+', '')}\n\n` +
    `Have a great trip! 🚗`;

  await sendTextMessage(params.passengerPhone, message);
}

/**
 * Notify a passenger that their request was declined.
 */
export async function notifyPassengerDeclined(params: {
  passengerPhone: string;
  driverName:     string;
  departureTime:  string;
}): Promise<void> {
  const message =
    `❌ *N1Lift – Request Declined*\n\n` +
    `Sorry, *${params.driverName}* couldn't take you on the ` +
    `${params.departureTime} lift.\n\n` +
    `Open N1Lift to find another ride. 🔍`;

  await sendTextMessage(params.passengerPhone, message);
}

/**
 * Notify all confirmed passengers that a lift has been cancelled.
 */
export async function notifyLiftCancelled(params: {
  passengerPhone: string;
  driverName:     string;
  departureTime:  string;
}): Promise<void> {
  const message =
    `⚠️ *N1Lift – Lift Cancelled*\n\n` +
    `*${params.driverName}* has cancelled the ${params.departureTime} lift.\n\n` +
    `Open N1Lift to find an alternative ride. 🔍`;

  await sendTextMessage(params.passengerPhone, message);
}

/**
 * Send a ride reminder 1 hour before departure.
 */
export async function sendRideReminder(params: {
  phone:          string;
  role:           'driver' | 'passenger';
  otherPartyName: string;
  fromAddress:    string;
  departureTime:  string;
}): Promise<void> {
  const roleMsg = params.role === 'driver'
    ? `You have passengers to pick up`
    : `Your driver *${params.otherPartyName}* will be collecting you`;

  const message =
    `⏰ *N1Lift – Ride Reminder*\n\n` +
    `${roleMsg} at *${params.departureTime}*\n` +
    `📍 ${params.fromAddress}\n\n` +
    `Safe travels! 🚗`;

  await sendTextMessage(params.phone, message);
}
