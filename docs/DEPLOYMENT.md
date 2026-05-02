# Deployment

How to deploy BeeFree to production.

---

## Architecture

```
GitHub (source code)
    │
    ▼
Vercel (hosting)
    │
    ├── Next.js pages → Vercel CDN (static)
    └── API routes    → Vercel Serverless Functions
```

Every push to `main` triggers an automatic deployment on Vercel.

---

## Prerequisites

Before deploying you need accounts on:
- Vercel (vercel.com)
- MongoDB Atlas (cloud.mongodb.com)
- Privy (privy.io)
- Livepeer Studio (livepeer.studio)
- Razorpay (razorpay.com) — for payments

---

## Step 1 — MongoDB Atlas

1. Create a free cluster (M0)
2. Create a database user with read/write access
3. **Network Access → Add IP Address → `0.0.0.0/0`**
   - Vercel functions use dynamic IPs — must allow all
   - Without this, all DB connections fail in production
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/beefree`

**For production (not free tier):**
- Upgrade to M10 ($57/month) — handles production traffic
- M0 pauses after ~60 minutes of inactivity
- M0 has 512MB storage limit

---

## Step 2 — Privy

1. Create app at privy.io
2. Settings → App ID → copy `NEXT_PUBLIC_PRIVY_APP_ID`
3. Settings → App Secret → copy `PRIVY_APP_SECRET`
4. Settings → Allowed Domains → add your production URL
5. **For Google OAuth:** Google Cloud Console → OAuth client → Authorized redirect URIs → add `https://auth.privy.io/api/v1/oauth/callback`

**Dev vs Production plan:**
- Dev plan: max 150 users. Fine for testing.
- Production plan: $0.05/MAU, required for launch

---

## Step 3 — Livepeer Studio

1. Create project at livepeer.studio
2. Developers → API Keys → Create Key → copy as `LIVEPEER_API_KEY`
3. Developers → Signing Keys → Create Key
   - Copy Private Key immediately (shown ONCE)
   - Copy Public Key
   - Both are already base64 encoded — use as-is

4. **Webhooks:**
   - Developers → Webhooks → New Webhook
   - URL: `https://your-domain.vercel.app/api/webhooks/livepeer`
   - Events: `asset.ready`, `asset.failed`, `stream.started`, `stream.idle`

---

## Step 4 — Razorpay

**Test mode (current):**
- Dashboard → Settings → API Keys → generate test keys
- Keys start with `rzp_test_`

**Live mode (for real payments):**
- Complete KYC (PAN, GST, bank account, business details)
- Dashboard → Settings → API Keys → generate live keys
- Keys start with `rzp_live_`
- Add webhook: Settings → Webhooks → `https://your-domain.vercel.app/api/webhooks/razorpay` → event: `payment.captured`

---

## Step 5 — Vercel

```bash
cd /Users/santo/Desktop/work/beefree/web
npx vercel
# Follow prompts — link to existing project or create new
```

Or push to GitHub and import repo at vercel.com.

**Set all environment variables in Vercel dashboard:**

Project → Settings → Environment Variables → add each:

```
MONGODB_URI
NEXT_PUBLIC_PRIVY_APP_ID
PRIVY_APP_SECRET
LIVEPEER_API_KEY
LIVEPEER_PRIVATE_KEY
LIVEPEER_PUBLIC_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
NEXT_PUBLIC_APP_URL
```

**Important for `NEXT_PUBLIC_APP_URL`:** Set to `https://your-domain.vercel.app` (no trailing slash).

After setting env vars, redeploy:
```bash
npx vercel --prod
```

---

## Environment Variables Reference

| Variable | Where to get | Server/Client | Required |
|----------|-------------|---------------|----------|
| `MONGODB_URI` | MongoDB Atlas → Connect | Server only | ✅ |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy dashboard → App ID | Both (public) | ✅ |
| `PRIVY_APP_SECRET` | Privy dashboard → App Secret | Server only | ✅ |
| `LIVEPEER_API_KEY` | Livepeer Studio → API Keys | Server only | ✅ |
| `LIVEPEER_PRIVATE_KEY` | Livepeer Studio → Signing Keys | Server only | ✅ |
| `LIVEPEER_PUBLIC_KEY` | Livepeer Studio → Signing Keys | Server only | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys | Server only | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys | Server only | ✅ |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID | Both (public) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your production URL | Both (public) | ✅ |

`NEXT_PUBLIC_` prefix = safe to expose in browser bundle. All others = server-side only.

---

## Switching to Live Payments

Only environment variable changes needed. No code changes.

```bash
# Update these 3 in Vercel dashboard:
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=live_secret_xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
```

Then redeploy.

---

## Making Someone a Creator

There's no creator registration UI. Do it manually in MongoDB:

1. MongoDB Atlas → Browse Collections → users
2. Find the user by email or name
3. Click Edit (pencil icon)
4. Change `role: "fan"` → `role: "creator"`
5. Click Update

Next time they log in, they'll see the Dashboard link in the navbar.

---

## Deployment Checklist

```
Before launch:
  □ MongoDB Atlas network: 0.0.0.0/0 allowed
  □ MongoDB Atlas: M10 or higher (not M0)
  □ Privy: production plan (not dev — 150 user limit)
  □ Privy: production domain added to allowed domains
  □ Livepeer: webhook configured (URL + 4 events)
  □ Razorpay: KYC complete
  □ Razorpay: live keys in Vercel env vars
  □ Razorpay: webhook URL configured
  □ Vercel: all env vars set
  □ NEXT_PUBLIC_APP_URL: set to production URL
  □ Google OAuth: production domain added (if using Google login)

After launch:
  □ Test login with each method (email, SMS, Google)
  □ Test video upload
  □ Test free video playback
  □ Test premium video (subscribe + watch)
  □ Test livestream (browser + OBS)
  □ Test premium stream access control
  □ Test subscription payment end-to-end with real card
  □ Test Razorpay webhook by checking MongoDB after payment
```

---

## Common Production Issues

### "MongoServerSelectionError: ReplicaSetNoPrimary"
MongoDB Atlas M0 paused due to inactivity. Go to cloud.mongodb.com → Clusters → Resume. Upgrade to M10 to prevent this.

### "Authentication failed" on all API calls
`PRIVY_APP_SECRET` or `NEXT_PUBLIC_PRIVY_APP_ID` is wrong or not set in Vercel. Check Vercel → Project → Settings → Environment Variables.

### Videos stuck at "processing"
Livepeer webhook not configured. Go to Livepeer Studio → Developers → Webhooks → verify the URL and events.

### Payments work but subscriptions not activating
`RAZORPAY_KEY_SECRET` mismatch. The signature verification fails silently. Check Vercel logs for "[Verify] Signature mismatch".

### Premium videos show 401 in production but work locally
`LIVEPEER_PRIVATE_KEY` or `LIVEPEER_PUBLIC_KEY` not set in Vercel, or missing `==` padding at end of base64 string.