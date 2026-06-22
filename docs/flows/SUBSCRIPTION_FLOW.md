# Subscription Flow

How a fan pays to subscribe to a creator — from clicking "Subscribe" to unlocking premium content.

---

## Overview

LyveFree uses Razorpay for payments. Each creator sets their own monthly subscription price. There are no free trials and no grace periods — access is immediate after payment and ends exactly 30 days later.

The payment flow involves 5 actors:
1. **Fan's browser** — clicks subscribe, opens checkout, sends payment details
2. **Our server** — creates order, verifies payment, activates subscription
3. **Razorpay's server** — processes actual payment (UPI/card/netbanking)
4. **Razorpay's webhook** — backup confirmation if frontend fails
5. **MongoDB** — stores subscription document

---

## Systems Involved

```
Browser            Our Server          Razorpay          MongoDB
  │                    │                   │                 │
  ▼                    ▼                   ▼                 ▼
creator/[id]/      subscriptions/      Orders API        Subscription
page.tsx           route.ts            Checkout JS       model
                   subscriptions/      Webhooks
                   verify/route.ts
                   webhooks/razorpay/
                   route.ts
```

---

## Step-by-Step Flow

### Step 1 — Fan Visits Creator Profile

**File:** `web/app/creator/[id]/page.tsx`

When the page loads, two things happen:

**A) Load creator and their videos:**
```typescript
useEffect(() => {
  fetch(`/api/creators/${id}`)
    .then(r => r.json())
    .then(data => {
      setCreator(data.data.creator)
      setVideos(data.data.videos)
    })
}, [id])
```

**B) Check if fan is already subscribed:**
```typescript
useEffect(() => {
  if (!user || !id) return

  // Creator doesn't subscribe to their own content
  if (user._id === id) {
    setIsSubscribed(true)
    return
  }

  getAccessToken().then(token => {
    fetch(`/api/subscriptions?creatorId=${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setIsSubscribed(data.data.subscribed)
      })
  })
}, [user, id])
```

---

### Step 2 — Subscribe Button Shows (if premium content exists)

```typescript
const hasPremiumContent = videos.some(v => v.access === 'premium')

{hasPremiumContent && (
  <>
    {isSubscribed ? (
      <span>✓ Subscribed — Premium content unlocked</span>
    ) : (
      <Button onClick={handleSubscribe}>
        Subscribe ₹{priceInRupees}/month
      </Button>
    )}
  </>
)}
```

The subscribe button only appears if the creator has at least one premium video. No premium content = no subscribe button (nothing to unlock).

Price is shown in rupees but stored in paise: `priceInRupees = creator.subscriptionPrice / 100`.

---

### Step 3 — Fan Clicks Subscribe

**File:** `web/app/creator/[id]/page.tsx` → `handleSubscribe()`

```typescript
const handleSubscribe = async () => {
  // If not logged in, open Privy login modal first
  if (!user) {
    login()
    return
  }

  const token = await getAccessToken()

  // Step A: Create order on our backend
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ creatorId: id }),
  })

  const data = await res.json()
  const { orderId, amount } = data.data

  // Step B: Load Razorpay checkout script
  // Loaded dynamically (not in <head>) to avoid loading on every page
  await loadRazorpayScript()

  // Step C: Open Razorpay checkout popup
  const options = {
    key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount,                    // in paise
    currency: 'INR',
    name:     'LyveFree',
    description: `Subscribe to ${creator?.name}`,
    order_id: orderId,         // from Step A
    handler: async (response) => {
      // Step D: Verify payment after checkout completes
      // Called automatically by Razorpay after successful payment
    },
    prefill: { name: user.name, email: user.email },
    theme: { color: '#f5e642' },
    modal: {
      ondismiss: () => setSubscribing(false)  // user closed checkout
    }
  }

  // window.Razorpay is added by the checkout script
  const rzp = new window.Razorpay(options)
  rzp.open()
}

// Load Razorpay checkout.js dynamically
const loadRazorpayScript = (): Promise<void> => {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(); return }  // already loaded
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
}
```

---

### Step 4 — Our Backend Creates Razorpay Order

**File:** `web/app/api/subscriptions/route.ts` → `POST` handler

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify auth
  const verifiedClaims = await privy.verifyAuthToken(authToken)

  // 2. Find fan
  await connectDB()
  const fan = await User.findOne({ privyId: verifiedClaims.userId })

  // 3. Get creator + their price
  const { creatorId } = await req.json()
  const creator = await User.findOne({ _id: creatorId, role: 'creator', isBanned: false })

  // 4. Check not already subscribed
  const existing = await Subscription.findOne({
    fan: fan._id,
    creator: creator._id,
    status: 'active',
    validUntil: { $gt: new Date() }
  })
  if (existing) return { error: 'Already subscribed' }

  // 5. Create order on Razorpay
  // This reserves the payment — Razorpay creates an order record
  // Receipt max 40 chars — use timestamp only
  const amount = creator.subscriptionPrice || 9900
  const order = await razorpay.orders.create({
    amount,           // in paise
    currency: 'INR',
    receipt: `sub_${Date.now()}`,  // max 40 chars!
  })
  // order.id = "order_ABC123" — Razorpay's order ID

  // 6. Save subscription in MongoDB (status will be confirmed after payment)
  const subscription = await Subscription.create({
    fan:             fan._id,
    creator:         creator._id,
    status:          'active',    // set active now — will be verified shortly
    planType:        'monthly',
    razorpayOrderId: order.id,
    amount,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days
  })

  return {
    success: true,
    data: {
      orderId:    order.id,
      amount,
      currency:   'INR',
      creatorName: creator.name,
    }
  }
}
```

**Why save subscription before payment is confirmed?**
We create the subscription record immediately so we have a document to update when the payment comes in. The `razorpayOrderId` links our MongoDB subscription to Razorpay's order.

**Status starts as `pending`, not `active`.**
The subscription is created with `status: "pending"` and only becomes `"active"` after signature verification in `/api/subscriptions/verify`. Pending subscriptions older than 24 hours are automatically cleaned up on the next subscribe attempt.

**Why is receipt limited to 40 chars?**
Razorpay's API requires receipt to be max 40 characters. We learned this the hard way — `sub_${fanId}_${creatorId}_${timestamp}` was 70+ characters and caused a 400 error. `sub_${Date.now()}` is 17 characters and guaranteed unique.

---

### Step 5 — Fan Pays via Razorpay Checkout

The Razorpay checkout popup opens. The fan sees:
- LyveFree branding
- Amount: ₹199 (or whatever the creator set)
- Payment options: UPI, debit/credit card, netbanking, wallet

The fan enters their payment details. Razorpay handles ALL of this — we write zero payment processing code.

**Test mode:** Use these test cards:
- Card: `4111 1111 1111 1111` / Any future date / Any CVV
- UPI: `success@razorpay` (success) or `failure@razorpay` (failure)
- Test bank: Choose any bank → Success or Failure buttons appear

---

### Step 6 — Razorpay Returns Payment Details to Browser

After successful payment, Razorpay calls our `handler` function with:
```typescript
{
  razorpay_payment_id: "pay_xyz789",   // Razorpay's payment ID
  razorpay_order_id:   "order_abc123", // our order ID from Step 4
  razorpay_signature:  "abc...def"     // HMAC signature for verification
}
```

These are returned to the browser. The browser then calls our backend to verify.

---

### Step 7 — Browser Calls Our Verification Endpoint

```typescript
handler: async (response) => {
  const verifyRes = await fetch('/api/subscriptions/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id:   response.razorpay_order_id,
      razorpay_signature:  response.razorpay_signature,
    }),
  })

  const verifyData = await verifyRes.json()
  if (verifyData.success) {
    setIsSubscribed(true)  // unlock premium content in UI
  }
}
```

---

### Step 8 — Our Backend Verifies Payment Signature

**File:** `web/app/api/subscriptions/verify/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

  // VERIFY SIGNATURE — this is the critical security step
  // Razorpay signs: order_id + "|" + payment_id using your secret key
  // We recompute this signature and compare
  // If they match: payment is genuinely from Razorpay, not forged
  // If they don't: someone is trying to fake a payment
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return { error: 'Invalid payment signature' }  // 400
  }

  // Find fan
  const fan = await User.findOne({ privyId: verifiedClaims.userId })

  // Find the subscription by orderId and update it
  const subscription = await Subscription.findOneAndUpdate(
    {
      fan:             fan._id,
      razorpayOrderId: razorpay_order_id,
    },
    {
      razorpayPaymentId: razorpay_payment_id,
      status:            'active',
      validUntil:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  )

  return { success: true, data: { subscriptionId: subscription._id, validUntil } }
}
```

**Why verify the signature?**
The browser receives `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` from Razorpay. Without verification, anyone could send fake IDs to our server and claim to have paid. The signature is a cryptographic proof that Razorpay generated these values using our secret key.

---

### Step 9 — Razorpay Webhook (Backup)

**File:** `web/app/api/webhooks/razorpay/route.ts`

What if the browser closes before Step 7? (user closes tab, network drops, etc.) The subscription would exist in MongoDB but the payment might be confirmed by Razorpay without our server knowing.

Razorpay solves this by sending a webhook:

```typescript
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) return 400

  const body = JSON.parse(rawBody)

  if (body.event === 'payment.captured') {
    const payment = body.payload?.payment?.entity
    const orderId = payment?.order_id

    // Only update if not already active (prevents double-processing)
    await Subscription.findOneAndUpdate(
      {
        razorpayOrderId: orderId,
        status: { $ne: 'active' },  // $ne = not equal
      },
      {
        razorpayPaymentId: payment.id,
        status:            'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    )
  }

  return { received: true }
}
```

This runs server-to-server (Razorpay → our server). Even if the fan's browser crashes mid-payment, the subscription still gets activated.

**In test mode:** Razorpay webhooks don't fire for localhost. The `handler` function in the browser is sufficient for testing. Configure the webhook in Razorpay dashboard for production.

---

## Subscription Check (GET)

**File:** `web/app/api/subscriptions/route.ts` → `GET` handler

Called every time a fan visits a creator's profile, a premium video, or a premium stream:

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creatorId')

  const fan = await User.findOne({ privyId: verifiedClaims.userId })

  // Find active, non-expired subscription
  const subscription = await Subscription.findOne({
    fan:        fan._id,
    creator:    creatorId,
    status:     'active',
    validUntil: { $gt: new Date() },  // $gt = greater than (not expired)
  })

  return {
    success: true,
    data: {
      subscribed: !!subscription,        // true or false
      validUntil: subscription?.validUntil || null,
    }
  }
}
```

This query uses the `{ fan: 1, creator: 1 }` index for O(log n) lookup. It runs on every premium page load, so performance matters.

---

## Data Flow Diagram

```
Browser              Our Server          Razorpay           MongoDB
   │                     │                   │                  │
   │── click Subscribe ──►│                   │                  │
   │                     │                   │                  │
   │              verify Privy JWT            │                  │
   │              find fan in DB              │                  │
   │              find creator + price        │                  │
   │              check not already subbed    │                  │
   │                     │                   │                  │
   │                     │── orders.create() ──►│               │
   │                     │   { amount: 19900 }  │               │
   │                     │◄── { id: "order_x" } │               │
   │                     │                   │                  │
   │                     │── Subscription.create() ─────────────►│
   │                     │   { status: "active", orderId }       │
   │◄── { orderId, amount } ─│                │                  │
   │                     │                   │                  │
   │  Razorpay checkout opens                 │                  │
   │  fan enters payment details              │                  │
   │  ─────────────────────────────────────────►│               │
   │  Razorpay processes payment               │ UPI/bank       │
   │  ◄─────────────────────────────────────────│               │
   │                     │                   │                  │
   │  handler({ paymentId, orderId, signature })                  │
   │                     │                   │                  │
   │── POST /api/subscriptions/verify ────────►│                │
   │                     │                   │                  │
   │              HMAC verify signature       │                  │
   │              find subscription by orderId │                 │
   │              update razorpayPaymentId     │                 │
   │              update status: "active"      │                 │── Subscription.update ──►│
   │                     │◄──────────────────────────────────────│
   │◄── { success } ─────│                   │                  │
   │                     │                   │                  │
   │  setIsSubscribed(true)                   │                  │
   │  premium content unlocks                 │                  │
   │                     │                   │                  │
   │          (separately, as backup)         │                  │
   │                     │◄── webhook ────────│                  │
   │                     │  payment.captured  │                  │
   │                     │── update if not already active ──────►│
```

---

## Switching to Live Payments

No code changes needed. Just update environment variables:

```bash
# .env.local (or Vercel environment variables)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=live_secret_xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
```

Also:
1. Complete Razorpay KYC (business registration required for live keys)
2. In Razorpay dashboard: Settings → Webhooks → add `https://beefree-nine.vercel.app/api/webhooks/razorpay` → select `payment.captured`

---

## Common Errors

### "Already subscribed" (400)
Fan has an active subscription. The UI should show "✓ Subscribed" instead of the subscribe button. Check that the subscription check useEffect ran correctly.

### "Failed to create subscription" — receipt error
Receipt length exceeds 40 characters. Use `sub_${Date.now()}` only (17 chars).

### "Invalid payment signature" (400)
`RAZORPAY_KEY_SECRET` doesn't match what Razorpay used to sign. Check the key in `.env.local` matches the Razorpay dashboard.

### Payment succeeded but subscription not activated
Either the `handler` function didn't fire (network issue) or the webhook hasn't fired yet. Check MongoDB — if `razorpayOrderId` exists but `razorpayPaymentId` is empty, the payment is confirmed by Razorpay but our verify endpoint wasn't called. The webhook will eventually activate it.

### Razorpay checkout doesn't open
`NEXT_PUBLIC_RAZORPAY_KEY_ID` is missing or wrong in env. This env var is public (NEXT_PUBLIC_ prefix) so it's embedded in the browser bundle at build time.