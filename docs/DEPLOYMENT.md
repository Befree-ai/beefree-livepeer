# Deployment

How to deploy LyveFree to production.

---

## Architecture
GitHub (source code)
│
▼
Vercel (hosting)
│
├── Next.js pages → Vercel CDN (static)
└── API routes    → Vercel Serverless Functions

Every push to `main` triggers an automatic deployment on Vercel.

---

## Prerequisites

Before deploying you need accounts on:
- Vercel (vercel.com)
- MongoDB Atlas (cloud.mongodb.com)
- Privy (privy.io)
- Livepeer Studio (livepeer.studio)
- Razorpay (razorpay.com)
- Cloudinary (cloudinary.com) — for avatar image uploads

---

## Step 1 — MongoDB Atlas

1. Create a free cluster (M0)
2. Create a database user with read/write access
3. **Network Access → Add IP Address → `0.0.0.0/0`**
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/beefree`

---

## Step 2 — Privy

1. Create app at privy.io
2. Settings → App ID → copy `NEXT_PUBLIC_PRIVY_APP_ID`
3. Settings → App Secret → copy `PRIVY_APP_SECRET`
4. Settings → Allowed Domains → add your production URL
5. Enable: Email OTP, SMS OTP, Google OAuth, Embedded Wallets (Ethereum, MPC)

---

## Step 3 — Livepeer Studio

1. Create project at livepeer.studio
2. Developers → API Keys → Create Key → copy as `LIVEPEER_API_KEY`
3. Developers → Signing Keys → Create Key
   - Copy Private Key immediately (shown ONCE)
   - Copy Public Key
4. **Webhooks:**
   - Developers → Webhooks → New Webhook
   - URL: `https://your-domain.vercel.app/api/webhooks/livepeer`
   - Events: `asset.ready`, `asset.failed`, `stream.started`, `stream.idle`

---

## Step 4 — Razorpay

**Test mode (current):**
- Dashboard → Settings → API Keys → generate test keys (start with `rzp_test_`)

**Live mode:**
- Complete KYC (PAN, GST, bank account, business details)
- Generate live keys (start with `rzp_live_`)
- Add webhook: `https://your-domain.vercel.app/api/webhooks/razorpay` → event: `payment.captured`

---

## Step 5 — Cloudinary

1. Create free account at cloudinary.com
2. Dashboard → Copy Cloud Name, API Key, API Secret
3. No additional configuration needed — folder `beefree/avatars` is created automatically on first upload

---

## Step 6 — Vercel

```bash
cd /Users/santo/Desktop/work/beefree/web
vercel --prod
```

**Set all environment variables in Vercel dashboard:**

Project → Settings → Environment Variables

---

## Environment Variables Reference

| Variable | Where to get | Server/Client | Required |
|----------|-------------|---------------|----------|
| `MONGODB_URI` | MongoDB Atlas → Connect | Server only | ✅ |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy → App ID | Both | ✅ |
| `PRIVY_APP_SECRET` | Privy → App Secret | Server only | ✅ |
| `LIVEPEER_API_KEY` | Livepeer → API Keys | Server only | ✅ |
| `LIVEPEER_PRIVATE_KEY` | Livepeer → Signing Keys | Server only | ✅ |
| `LIVEPEER_PUBLIC_KEY` | Livepeer → Signing Keys | Server only | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay → API Keys | Server only | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay → API Keys | Server only | ✅ |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID | Both | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your production URL | Both | ✅ |
| `ADMIN_EMAIL` | Your admin email | Server only | ✅ |
| `ADMIN_PRIVY_ID` | Your Privy user ID | Server only | ✅ |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Your admin email | Both | ✅ |
| `NEXT_PUBLIC_ADMIN_PRIVY_ID` | Your Privy user ID | Both | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard | Server only | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard | Server only | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard | Server only | ✅ |
| `CRON_SECRET` | Any random string | Server only | ✅ |

---

## Cron Job Setup

LyveFree uses a cron job to expire old subscriptions. Configure in Vercel:

`web/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-subscriptions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs daily at midnight UTC. The `CRON_SECRET` env var protects the endpoint.

---

## Creator Application Flow (not manual anymore)

Previously creators were made by manually editing MongoDB. Now:

1. User visits `/apply` and submits application
2. Admin visits `/admin` page
3. Admin clicks Approve → user's role is automatically set to `"creator"`
4. User signs out and back in → Dashboard appears

Admin access is controlled by `ADMIN_EMAIL` and `ADMIN_PRIVY_ID` env vars.

---

## Browser Streaming Note

Browser streaming (WebRTC) works on **Brave** and **Firefox**. Chrome sends B-frames which Livepeer WebRTC rejects. For demos and pitch — use Brave browser or OBS.

OBS streaming works on all browsers and is the recommended method for creators:
- Server: `rtmp://rtmp.livepeer.com/live`
- Stream Key: from LyveFree dashboard

---

## Deployment Checklist
Before launch:
□ MongoDB Atlas: 0.0.0.0/0 network access allowed
□ MongoDB Atlas: M10 or higher (not M0)
□ Privy: production plan (150 user limit on dev)
□ Privy: production domain added to allowed domains
□ Livepeer: webhook configured (URL + 4 events)
□ Razorpay: KYC complete for live keys
□ Razorpay: webhook URL configured
□ Cloudinary: account created, keys in Vercel
□ Vercel: all env vars set
□ NEXT_PUBLIC_APP_URL: set to production URL
□ ADMIN_EMAIL + ADMIN_PRIVY_ID: set correctly
□ vercel.json: cron job configured
□ CRON_SECRET: set in Vercel env vars
After launch:
□ Test login (email, SMS, Google)
□ Test creator application → admin approval
□ Test avatar upload (Cloudinary)
□ Test video upload + playback
□ Test free video
□ Test premium video (subscribe + watch)
□ Test livestream (Brave browser + OBS)
□ Test follow/unfollow
□ Test subscription payment end-to-end
□ Test cron job (expire-subscriptions endpoint)

---

## Common Production Issues

### "MongoServerSelectionError"
MongoDB Atlas M0 paused. Go to cloud.mongodb.com → Resume. Upgrade to M10 to prevent.

### "Authentication failed" on all API calls
`PRIVY_APP_SECRET` or `NEXT_PUBLIC_PRIVY_APP_ID` wrong in Vercel.

### Videos stuck at "processing"
Livepeer webhook not configured. Check Livepeer Studio → Developers → Webhooks.

### Avatar upload fails in production
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, or `CLOUDINARY_API_SECRET` not set in Vercel.

### Admin page shows "Access denied"
`NEXT_PUBLIC_ADMIN_EMAIL` or `NEXT_PUBLIC_ADMIN_PRIVY_ID` not set, or doesn't match logged-in user.

### Stream shows Idle in Livepeer dashboard
Using Chrome for browser streaming — Chrome sends B-frames which fail. Switch to Brave or use OBS.

### Payments work but subscriptions not activating
`RAZORPAY_KEY_SECRET` mismatch. Signature verification fails silently.

### Premium videos show 401 in production
`LIVEPEER_PRIVATE_KEY` or `LIVEPEER_PUBLIC_KEY` not set in Vercel, or missing `==` padding.
