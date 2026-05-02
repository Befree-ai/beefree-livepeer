# Premium Access Flow

How premium content is gated — covering both JWT-based video protection (CDN level) and stream access control (UI level).

---

## Overview

Two types of premium content, two different protection mechanisms:

| Content | Protection | Level | How it works |
|---------|-----------|-------|--------------|
| Premium Videos | Livepeer JWT | CDN level | Livepeer CDN rejects requests without valid JWT |
| Premium Streams | Subscription check | UI level | Our app checks DB and hides player if not subscribed |

Video protection is stronger — even if someone has the playbackId URL, they cannot watch without a valid JWT from our server. Stream protection is UI-only — the playbackId works directly if accessed outside our app.

---

## Premium Video Protection (JWT/CDN Level)

### How It Works End-to-End

```
1. Creator uploads video with access: "premium"
   → Our server calls livepeer.asset.create({ playbackPolicy: { type: Type.Jwt } })
   → Livepeer marks this asset as JWT-required

2. Fan visits /video/[id]
   → Our server gets video from DB: access === "premium"
   → Fan is not subscribed → our server returns 403
   → Fan is subscribed → our server signs JWT with private key
   → JWT returned to browser

3. Browser passes JWT to Livepeer player
   → Player includes JWT in every HLS segment request
   → Livepeer validates JWT using our registered public key
   → Valid → serve video
   → Invalid/expired/missing → 401
```

---

### Setting Playback Policy at Upload

**File:** `web/app/api/videos/route.ts`

```typescript
const response = await livepeer.asset.create({
  name: title,
  playbackPolicy:
    access === 'premium'
      ? { type: Type.Jwt }      // Livepeer requires JWT for every request
      : { type: Type.Public },  // Anyone can access
})
```

This is set **once at creation time** and cannot be changed retroactively without recreating the asset.

`Type.Jwt` vs `Type.Public` imports from:
```typescript
import { Type } from 'livepeer/models/components'
```
NOT `TypeT` — that doesn't exist.

---

### Signing the JWT

**File:** `web/app/api/videos/[id]/jwt/route.ts`

```typescript
// Import
import { signAccessJwt } from '@livepeer/core/crypto'

// Sign
const jwt = await signAccessJwt({
  privateKey: process.env.LIVEPEER_PRIVATE_KEY!,
  publicKey:  process.env.LIVEPEER_PUBLIC_KEY!,
  issuer:     'https://beefree-nine.vercel.app',
  playbackId: video.playbackId,
  expiration: 3600,   // 1 hour duration in SECONDS — NOT unix timestamp
  custom: {
    userId: user._id.toString(),
  },
})
```

**Critical facts about the keys:**

The keys in `.env.local` are **base64-encoded PEM files**. Example:
```
LIVEPEER_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...==
```

When decoded from base64, this becomes:
```
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49...
-----END PRIVATE KEY-----
```

`signAccessJwt` handles this decoding internally. Its source code:
```javascript
const privateKey = typeof options.privateKey === "string"
  ? await importPKCS8(b64Decode(options.privateKey) ?? options.privateKey)
  : options.privateKey;
```

It `b64Decode`s the string first (base64 → PEM), then imports it. **Pass the raw env variable — do not decode it yourself.** Manual decoding breaks it.

**Critical fact about expiration:**
```typescript
expiration: 3600        // ✅ CORRECT — duration in seconds (1 hour)
expiration: Math.floor(Date.now() / 1000) + 3600  // ❌ WRONG — unix timestamp
```

The `expiration` field is a duration, not a unix timestamp. Passing a unix timestamp (like `1776550631`) means "expiring in 56,000 years" which Livepeer rejects as invalid.

---

### How the JWT Is Structured

A Livepeer JWT is three base64url-encoded parts separated by dots:

```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (alg + type)
.
eyJhY3Rpb24iOiJwdWxsIiwiaXNzIjoiLi4u  ← Payload
.
signature                                ← ECDSA SHA-256 signature
```

Payload contains:
```json
{
  "action": "pull",
  "iss": "https://beefree-nine.vercel.app",
  "pub": "<public_key>",
  "sub": "<playbackId>",
  "video": "none",
  "exp": 1776554321,
  "iat": 1776550721,
  "custom": { "userId": "69e0ee8fd8a2c11162650862" }
}
```

`sub` (subject) = the playbackId this JWT is valid for. A JWT for `playbackId: "abc123"` cannot be used to watch `playbackId: "def456"`.

---

### Passing JWT to Player

**File:** `web/app/video/[id]/page.tsx`

```typescript
// MUST set JWT before src
// Wrong order: player tries to play without JWT → 401
setJwt(jwtData.data.jwt)
setSrc(getSrc(playbackData.data.playbackInfo))

// In JSX:
<Player.Root src={src} jwt={jwt ?? undefined}>
  <Player.Video />
</Player.Root>
```

The `@livepeer/react` player automatically includes the JWT in every HLS request:
```
GET /hls/abc123/index.m3u8
Livepeer-Jwt: eyJhbGci...
```

Livepeer CDN validates this on every request. The JWT is not just checked once at load — every segment request is validated. This prevents token sharing (sending the JWT to a friend who hasn't subscribed).

---

### JWT Expiry

JWTs expire after 1 hour. After expiry:
- Livepeer CDN returns 401 on segment requests
- `@livepeer/react` player shows error state
- User must reload the page
- Page fetches fresh JWT from our server
- Playback resumes

This is acceptable for MVP. Future improvement: implement background token refresh before expiry.

---

## Premium Stream Protection (UI Level)

### Why It's Different from Videos

Videos are created with `playbackPolicy: { type: Type.Jwt }` — Livepeer enforces JWT at the CDN level. Any HTTP request to watch the video without a valid JWT gets a 401.

Streams are created with **no playback policy** (currently). Livepeer serves them to anyone with the playbackId. Our protection is purely at the UI level — we check the subscription in our database and conditionally show or hide the player.

### The Flow

**File:** `web/app/stream/[playbackId]/page.tsx`

```typescript
// 1. Get stream from our DB
fetch(`/api/streams?playbackId=${playbackId}`)
  .then(async (streamData) => {
    const stream = streamData.data?.stream

    if (stream?.access === 'premium') {
      // 2. Check subscription
      const subscribed = await checkSubscription(stream.creator._id)
      const isCreator = user._id.toString() === stream.creator._id.toString()

      // 3. Block access if not subscribed and not creator
      if (!subscribed && !isCreator) {
        setIsLocked(true)
        return  // stop here — don't load player
      }
    }

    // 4. Load player (free stream, or subscribed/creator for premium)
    const playbackData = await fetch(`/api/playback/${playbackId}`)
    setSrc(getSrc(playbackData.data.playbackInfo))
  })
```

### What the Lock Screen Shows

For non-subscribers visiting a premium stream:
```typescript
<div className="aspect-video flex flex-col items-center justify-center gap-4">
  <LockIcon />
  <p>Premium Live Stream</p>
  <p>Subscribe to watch this stream</p>
  <Button onClick={handleSubscribe}>
    Subscribe ₹{Math.round(price / 100)}/month
  </Button>
</div>
```

Clicking Subscribe opens the Razorpay checkout (same flow as from creator profile). After payment verifies, `setIsLocked(false)` and the player loads.

### Security Limitations

If someone knows the playbackId and accesses `playback.livepeer.studio/hls/[playbackId]/index.m3u8` directly, they can watch without subscribing. The playbackId is not shown anywhere in our UI (only in the URL), making it harder to extract, but it's not impossible.

For production hardening, add JWT to stream creation:
```typescript
// web/app/api/streams/route.ts
const response = await livepeer.stream.create({
  name: title,
  record: true,
  playbackPolicy: access === 'premium'
    ? { type: 'jwt' }     // ← add this
    : undefined,
})
```

Then implement stream JWT signing (same as video JWT) and pass it to `Player.Root`.

---

## Creator Access — No Subscription Required

Both video and stream access checks include a creator bypass:

**Videos:**
```typescript
// web/app/api/videos/[id]/jwt/route.ts
const isCreator = user._id.toString() === video.creator.toString()

if (!isCreator) {
  // check subscription
}
// creator skips subscription check — always gets JWT
```

**Streams:**
```typescript
// web/app/stream/[playbackId]/page.tsx
const isCreator = user._id.toString() === stream.creator?._id?.toString()

if (!subscribed && !isCreator) {
  setIsLocked(true)
  return
}
// creator is never locked out
```

Note: Both compare `.toString()` explicitly. MongoDB ObjectIds and JavaScript strings compare differently. `objectId === "string"` always returns `false`. Converting both to strings before comparing is required.

---

## Keys Management

The Livepeer signing keys are ES256 (ECDSA P-256) key pairs.

**How they were generated:**
1. Livepeer Studio → Developers → Signing Keys → Create Key
2. Livepeer showed private key ONCE — had to copy immediately
3. Private key exported as base64-encoded PEM and stored in `.env.local`
4. Livepeer stores the public key on their servers for JWT validation

**Where they live:**
```
.env.local:
  LIVEPEER_PRIVATE_KEY = LS0tLS1C...==   (base64 encoded PEM, WITH == padding)
  LIVEPEER_PUBLIC_KEY  = LS0tLS1C...==   (base64 encoded PEM, WITH == padding)
```

**Critical:** The `==` padding at the end of base64 is required. Without it, base64 decoding produces garbage bytes and JWT signing fails silently (signs successfully but Livepeer rejects the JWT).

**If private key is lost:** Cannot be recovered. Must create new signing key in Livepeer Studio. All existing JWT-gated assets continue to work (they use the playbackId, not the key). New JWTs will be signed with the new key. Update env vars in Vercel.

---

## Summary: What Protects What

```
                    ┌─────────────────────────────────────┐
                    │         Premium Videos              │
                    │                                     │
Browser ────────────► Our Server checks subscription      │
                    │ → Signs Livepeer JWT if subscribed   │
                    │                                     │
                    └──────────────┬──────────────────────┘
                                   │ JWT
                                   ▼
                    ┌─────────────────────────────────────┐
                    │       Livepeer CDN (Video)          │
                    │                                     │
                    │ Validates JWT on EVERY segment      │
                    │ No JWT = 401 = cannot watch         │
                    │ Expired JWT = 401 = must reload     │
                    └─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │         Premium Streams             │
                    │                                     │
Browser ────────────► Our Server checks subscription      │
                    │ → Returns stream metadata           │
                    │                                     │
                    └──────────────┬──────────────────────┘
                                   │ subscription result
                                   ▼
                    ┌─────────────────────────────────────┐
                    │         Our UI (Stream)             │
                    │                                     │
                    │ Not subscribed = lock screen        │
                    │ No player = no stream URL in DOM    │
                    │                                     │
                    │ ⚠️ playbackId accessible directly   │
                    └─────────────────────────────────────┘
```