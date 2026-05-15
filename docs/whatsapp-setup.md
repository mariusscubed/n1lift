# WhatsApp Integration Setup (Meta Cloud API)

This guide walks you through connecting N1Lift to the Meta WhatsApp Cloud API.

---

## 1. Create a Meta App

1. Go to [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App** → choose **Business** type
3. Add the **WhatsApp** product to the app
4. Under *WhatsApp → API Setup*, note your:
   - **Phone Number ID** (`WHATSAPP_PHONE_NUMBER_ID`)
   - **WhatsApp Business Account ID** (`WHATSAPP_BUSINESS_ACCOUNT_ID`)

---

## 2. Generate a Permanent Access Token

1. Go to **Business Settings → System Users**
2. Create a System User with **Admin** role
3. Assign the WhatsApp app to the system user
4. Click **Generate Token** — copy and store as `WHATSAPP_ACCESS_TOKEN`

---

## 3. Register a Webhook

1. In your Meta App, go to **WhatsApp → Configuration → Webhooks**
2. Set the Callback URL to:  
   `https://your-backend-domain.com/api/webhooks/whatsapp`
3. Set the Verify Token to the value of `WHATSAPP_VERIFY_TOKEN` in your `.env`
4. Subscribe to the **messages** field

For local development, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Copy the https URL → use as Callback URL in Meta dashboard
```

---

## 4. Environment Variables

Add these to your `backend/.env` file:

```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=n1lift_verify
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
```

---

## 5. How the Integration Works

### Outbound (N1Lift → User)
| Event | Message sent to |
|---|---|
| Passenger requests a lift | Driver gets WhatsApp notification with YES/NO prompt |
| Driver replies YES | Passenger gets confirmation + driver's WhatsApp link |
| Driver replies NO | Passenger gets declined notification |
| Lift cancelled | All confirmed passengers notified |
| 1 hour before departure | Driver + passengers get a reminder |

### Inbound (User → N1Lift via WhatsApp)
Drivers reply to the bot:
- `YES <RequestID>` — confirms the request
- `NO <RequestID>` — declines the request

The RequestID is included in the original notification message.

---

## 6. WhatsApp OTP Login

Users can sign in using their WhatsApp number instead of social login:

```
POST /api/auth/otp/send    { phone: "+447700900000" }
POST /api/auth/otp/verify  { phone: "+447700900000", otp: "123456" }
```

The OTP is sent as a WhatsApp message and expires after 10 minutes.

---

## 7. Message Templates (Production)

For messages sent outside the 24-hour customer service window, Meta requires
pre-approved **message templates**. Submit these in Business Manager:

| Template Name | Use Case |
|---|---|
| `lift_request_driver` | Notify driver of a new passenger request |
| `lift_confirmed_passenger` | Notify passenger of confirmation |
| `lift_declined_passenger` | Notify passenger of decline |
| `lift_cancelled` | Notify passengers of cancellation |
| `ride_reminder` | 1-hour departure reminder |
| `otp_verification` | Phone number OTP |

Template approval typically takes 24–48 hours.

---

## 8. Useful Links

- [Meta Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)
- [ngrok](https://ngrok.com)
