# BeeFree — Technical Documentation

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Database | MongoDB Atlas + Mongoose | 8.x |
| Auth | Privy | v3.19.1 |
| Video Infrastructure | Livepeer | SDK v3.5.0 |
| Video Player/Broadcast | @livepeer/react | v4.3.6 |
| File Upload Protocol | tus-js-client | resumable |
| Payments | Razorpay | pending |
| Deployment | Vercel | — |

---

## Repository Structure

```
beefree/
├── contracts/                        # Smart contracts (not implemented yet)
├── scripts/                          # Utility scripts (empty for now)
└── web/                              # Next.js application (everything lives here)
    ├── app/                          # Next.js App Router
    │   ├── api/                      # All backend API routes (serverless functions on Vercel)
    │   │   ├── auth/
    │   │   │   └── sync/
    │   │   │       └── route.ts      # POST — Privy JWT verification + user sync
    │   │   ├── creators/
    │   │   │   ├── route.ts          # GET — list all creators
    │   │   │   └── [id]/
    │   │   │       └── route.ts      # GET — single creator + their videos
    │   │   ├── videos/
    │   │   │   ├── route.ts          # GET — video feed / POST — create asset
    │   │   │   └── [id]/
    │   │   │       └── route.ts      # GET — single video
    │   │   ├── playback/
    │   │   │   └── [playbackId]/
    │   │   │       └── route.ts      # GET — Livepeer playback info
    │   │   ├── streams/
    │   │   │   └── route.ts          # POST — create Livepeer stream
    │   │   ├── profile/
    │   │   │   └── route.ts          # PATCH — update user profile
    │   │   └── webhooks/
    │   │       └── livepeer/
    │   │           └── route.ts      # POST — Livepeer event handler
    │   ├── creator/
    │   │   └── [id]/
    │   │       └── page.tsx          # Public creator profile page
    │   ├── dashboard/                # Protected — creator only
    │   │   ├── layout.tsx            # Auth guard + sidebar navigation
    │   │   ├── page.tsx              # Overview — real stats from DB
    │   │   ├── upload/
    │   │   │   └── page.tsx          # TUS upload form + progress
    │   │   ├── videos/
    │   │   │   └── page.tsx          # Creator's video list
    │   │   ├── stream/
    │   │   │   └── page.tsx          # Go live — browser or OBS
    │   │   ├── profile/
    │   │   │   └── page.tsx          # Edit bio, genre, social links
    │   │   └── earnings/             # Not implemented yet
    │   ├── explore/
    │   │   └── page.tsx              # Discover creators
    │   ├── stream/
    │   │   └── [playbackId]/
    │   │       └── page.tsx          # Live stream viewer
    │   ├── video/
    │   │   └── [id]/
    │   │       └── page.tsx          # VOD player page
    │   ├── globals.css               # Tailwind v4 @theme tokens + base styles
    │   ├── layout.tsx                # Root layout — wraps app with Providers
    │   ├── page.tsx                  # Landing page
    │   └── providers.tsx             # PrivyProvider wrapper ('use client')
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx            # Fixed top nav — auth state aware
    │   │   └── Footer.tsx
    │   └── ui/
    │       ├── Button.tsx            # primary/secondary/ghost/danger variants
    │       └── Badge.tsx             # live/free/premium/verified/default
    ├── hooks/
    │   └── useAuth.ts                # Combined Privy + MongoDB user state
    ├── lib/
    │   ├── mongodb.ts                # Mongoose connection with Next.js caching
    │   └── livepeer.ts               # Livepeer SDK singleton (server-side only)
    ├── models/
    │   ├── User.ts
    │   ├── Video.ts
    │   ├── Stream.ts
    │   └── Subscription.ts
    └── types/
        └── index.ts                  # All shared TypeScript types
```

---

## Environment Variables

```env
# web/.env.local

MONGODB_URI=                          # MongoDB Atlas connection string
NEXT_PUBLIC_PRIVY_APP_ID=             # Privy app ID (safe to expose)
PRIVY_APP_SECRET=                     # Privy app secret (server-side only)
LIVEPEER_API_KEY=                     # Livepeer Studio API key (server-side only)
LIVEPEER_PRIVATE_KEY=                 # Base64 ES256 private key (JWT signing)
LIVEPEER_PUBLIC_KEY=                  # Base64 ES256 public key (JWT verify)
RAZORPAY_KEY_ID=                      # Razorpay key (not implemented yet)
RAZORPAY_KEY_SECRET=                  # Razorpay secret (not implemented yet)
NEXT_PUBLIC_RAZORPAY_KEY_ID=          # Razorpay key for frontend
NEXT_PUBLIC_APP_URL=                  # http://localhost:3000 or production URL
```

---

## Data Models

### User (`web/models/User.ts`)

Single collection for both fans and creators.
Creator-specific fields are empty strings/arrays for fans.

```typescript
{
  _id: ObjectId
  privyId: string          // "did:privy:xxx" — primary lookup key
                           // indexed + unique
  email?: string           // unique + sparse (allows multiple nulls)
  phone?: string           // unique + sparse
  name: string
  avatar: string
  role: "fan" | "creator"  // indexed — used in GET /api/creators query
  bio: string              // maxlength 500
  isBanned: boolean        // checked on every /api/auth/sync call
  isVerified: boolean      // set manually in MongoDB by team

  // Creator-only (empty for fans)
  genre: string[]
  socialLinks: { instagram, twitter, youtube }
  followersCount: number
  followingCount: number
  totalEarnings: number    // in paise

  createdAt: Date
  updatedAt: Date
}
```

### Video (`web/models/Video.ts`)

```typescript
{
  _id: ObjectId
  title: string
  description: string
  playbackId: string       // unique — Livepeer ID for viewers
  assetId: string          // unique — Livepeer ID for management
  thumbnailUrl: string
  duration: number         // seconds — set by Livepeer webhook
  creator: ObjectId        // ref: User — indexed
  access: "free" | "premium"
  status: "uploading" | "processing" | "ready" | "failed"  // indexed
  viewCount: number
  likes: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Indexes:
// { creator: 1, createdAt: -1 }  — creator's videos newest first
// { status: 1, access: 1 }       — public feed
```

### Stream (`web/models/Stream.ts`)

```typescript
{
  _id: ObjectId
  title: string
  streamId: string         // unique — Livepeer internal ID
  streamKey: string        // unique — secret, RTMP auth
  playbackId: string       // unique — public, for viewers
  creator: ObjectId        // ref: User — indexed
  access: "free" | "premium"
  status: "idle" | "live" | "ended"  // indexed
  viewerCount: number
  recordingPlaybackId: string
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Index: { creator: 1, status: 1 }
```

### Subscription (`web/models/Subscription.ts`)

```typescript
{
  _id: ObjectId
  fan: ObjectId
  creator: ObjectId
  status: "active" | "expired" | "cancelled"
  planType: "monthly" | "yearly"
  razorpayOrderId: string
  razorpayPaymentId: string
  amount: number           // paise — ₹99 = 9900
  validUntil: Date
  createdAt: Date
}

// Indexes:
// { fan: 1, creator: 1 }       — "is fan subscribed to creator?" query
// { status: 1, validUntil: 1 } — expiry cron job
```

---

## System Architecture — Data Flow by Scenario

### Scenario 1: User Logs In

```
Browser                 Privy                  Our Server          MongoDB
   │                      │                        │                   │
   │──── click Login ─────│                        │                   │
   │                      │                        │                   │
   │   Privy modal opens  │                        │                   │
   │   (email OTP / SMS   │                        │                   │
   │    / Google / wallet)│                        │                   │
   │                      │                        │                   │
   │   User verifies ─────│                        │                   │
   │                      │                        │                   │
   │◄── JWT token ────────│                        │                   │
   │                      │                        │                   │
   │─────────────── POST /api/auth/sync ───────────►│                   │
   │                Bearer: <jwt>                   │                   │
   │                                               │──── verifyAuthToken(jwt)
   │                                               │◄─── { userId } ───│(Privy SDK)
   │                                               │                   │
   │                                               │── User.findOne ──►│
   │                                               │◄── user / null ───│
   │                                               │                   │
   │                                               │── User.create ───►│ (if new)
   │                                               │◄── user ──────────│
   │                                               │                   │
   │◄──────────────── { success, user } ───────────│                   │

Who does what:
  Privy:      verifies identity, issues JWT, delivers OTP
  Our server: validates JWT, creates/finds user
  MongoDB:    stores user document
  Vercel:     runs the serverless function

Who needs scaling:
  Privy:   fully managed, scales automatically
  MongoDB: 1 read + maybe 1 write per login — negligible
  Vercel:  1 serverless call per login — negligible
```

---

### Scenario 2: Creator Uploads a Video

```
Browser                Our Server           Livepeer              MongoDB
   │                       │                    │                     │
   │── POST /api/videos ──►│                    │                     │
   │   { title, access }   │                    │                     │
   │                       │── verify JWT ──────►(Privy SDK)          │
   │                       │                    │                     │
   │                       │── asset.create ───►│                     │
   │                       │                    │ creates asset       │
   │                       │◄── { assetId,      │ returns TUS         │
   │                       │     playbackId,    │ endpoint            │
   │                       │     tusEndpoint }  │                     │
   │                       │                    │                     │
   │                       │── Video.create ───────────────────────►  │
   │                       │   status:"uploading"                      │
   │                       │◄── video doc ─────────────────────────── │
   │                       │                    │                     │
   │◄── { video,           │                    │                     │
   │      tusEndpoint } ───│                    │                     │
   │                       │                    │                     │
   │                                            │                     │
   │ (TUS upload — DIRECTLY browser to Livepeer, our server not involved)
   │                                            │                     │
   │──────── TUS chunks ───────────────────────►│                     │
   │◄─────── progress ──────────────────────────│                     │
   │──────── TUS complete ──────────────────────│                     │
   │                                            │                     │
   │                       (Livepeer transcodes: 1080p/720p/360p)     │
   │                                            │                     │
   │                       │◄── webhook ────────│                     │
   │                       │  asset.ready       │                     │
   │                       │  { assetId }       │                     │
   │                       │                    │                     │
   │                       │── Video.update ──────────────────────── ►│
   │                       │   status:"ready"                          │
   │                       │   duration: X secs                        │

Who does what:
  Our server:   creates asset on Livepeer, saves to MongoDB, returns TUS endpoint
  Browser:      uploads file directly to Livepeer (our server is NOT in upload path)
  Livepeer:     receives file, transcodes all quality variants, stores, CDN delivery
  Livepeer:     sends webhook when done
  Our server:   receives webhook, updates MongoDB status
  MongoDB:      stores video document, updates status

Who needs scaling:
  Livepeer:   handles all file storage and transcoding — scales automatically
  Our server: 2 serverless calls per upload (create + webhook) — negligible
  MongoDB:    2 writes per upload — M10 handles 10,000+ writes/sec easily
  
Critical point:
  Video file NEVER passes through our server
  Browser → Livepeer directly via TUS
  Our server only handles metadata
```

---

### Scenario 3: 1000 People Watch a Live Stream Simultaneously

```
Creator (broadcaster)
   │
   │ Browser WebRTC (WHIP)
   │ or OBS via RTMP
   │
   ▼
Livepeer Ingest
   │
   │ Livepeer transcodes stream in real time
   │ Distributes to global CDN edge nodes
   │
   ▼
Livepeer CDN (global edge)
   │
   │─────────────────────────────────────────────┐
   │                     │                        │
   ▼                     ▼                        ▼
Viewer 1            Viewer 500              Viewer 1000
(Mumbai)            (Delhi)                 (Bangalore)
   │                     │                        │
   Each viewer:          │                        │
   1. Loads /stream/[id] page (Vercel serves HTML)
   2. Browser calls GET /api/playback/[playbackId] ONCE
      → Our server → Livepeer API → returns CDN URLs
   3. After that, browser connects DIRECTLY to nearest
      Livepeer CDN edge node
      Our server is completely out of the video path

Data flow during stream:
  Creator → Livepeer Ingest → Livepeer CDN → 1000 Viewers
  
  Our server involvement:
  - 1000 API calls at page load (GET /api/playback)
  - 0 involvement during actual video playback

Who does what:
  Livepeer CDN:  serves video to all 1000 viewers — 100% their responsibility
  Our server:    1000 lightweight API calls when viewers join
  MongoDB:       0 queries during playback

Who needs scaling:
  Livepeer:   automatic — this is what they're built for
              pay per GB delivered (~$0.0025/GB)
              1000 viewers × 1 hour × 1080p (~2GB/hr) = 2000GB = ~$5
  
  Vercel:     1000 serverless calls at page load
              each call takes ~200ms, returns CDN URL
              Free tier: 100GB bandwidth — might need Pro for 1000 viewers
              Pro ($20/month) handles this easily
  
  MongoDB:    NOT involved during streaming at all
  
  Our server: completely out of video path after initial API call
```

---

### Scenario 4: 10,000 Users Browse Explore Page Simultaneously

```
10,000 browsers
   │
   │── GET /api/creators ──────────────────────►
   │                                            │
   │                               Vercel serverless function
   │                               (10,000 invocations in parallel)
   │                                            │
   │                                            │── User.find({ role:"creator" })
   │                                            │   .sort({ followersCount: -1 })
   │                                            │   .limit(12)
   │                                            │──────────────────────────────►
   │                                            │                              │
   │                                            │                           MongoDB
   │                                            │                           10,000 concurrent queries
   │                                            │◄─────────────────────────────│
   │◄── [creators array] ───────────────────────│

Who needs scaling here:
  MongoDB:   10,000 simultaneous queries — THIS is the bottleneck
             M10 ($57/month) handles ~1,000 concurrent connections
             10,000 simultaneous = M20/M30 needed ($200-$700/month)
  
  Vercel:    10,000 serverless functions — handles fine on Pro plan
  
THE FIX — Caching:
  Add cache header to /api/creators response:
  Cache-Control: s-maxage=60, stale-while-revalidate
  
  Vercel CDN caches the response for 60 seconds
  10,000 users → 1 MongoDB query per minute
  
  This is the most important optimization at scale
```

---

### Scenario 5: Fan Pays ₹99 to Subscribe (Razorpay — Coming Soon)

```
Browser              Our Server           Razorpay             MongoDB
   │                     │                    │                    │
   │── POST /api/subscriptions ─────────────►│                    │
   │   { creatorId }     │                   │                    │
   │                     │── order.create ──►│                    │
   │                     │◄── { orderId } ───│                    │
   │                     │                   │                    │
   │◄── { orderId } ─────│                   │                    │
   │                     │                   │                    │
   │ Razorpay checkout opens in browser      │                    │
   │ Fan pays via UPI/card/netbanking        │                    │
   │                     │                   │                    │
   │                     │◄── webhook ───────│                    │
   │                     │  payment.captured │                    │
   │                     │  { orderId,       │                    │
   │                     │    paymentId }    │                    │
   │                     │                   │                    │
   │                     │── Subscription.create ────────────────►│
   │                     │   status: "active"                      │
   │                     │   validUntil: now + 30 days             │
   │                     │                   │                    │
   │                     │── User.update ────────────────────────►│
   │                     │   totalEarnings += amount × 0.92        │

Who does what:
  Razorpay:     processes payment, handles UPI/bank APIs
  Our server:   creates order, receives webhook, updates DB
  MongoDB:      stores subscription record

Who needs scaling:
  Razorpay:   fully managed, no scaling needed
  MongoDB:    1 write per payment — negligible
  Our server: 2 serverless calls per payment — negligible
```

---

### Scenario 6: Fan Watches Premium Video (JWT Flow — Coming Soon)

```
Browser              Our Server           MongoDB           Livepeer CDN
   │                     │                    │                    │
   │── GET /api/videos/[id] ────────────────►│                    │
   │◄── video (access:"premium") ───────────│                    │
   │                     │                    │                    │
   │ Player shows "Subscribe to watch"       │                    │
   │                     │                    │                    │
   │── GET /api/jwt/[videoId] ──────────────►│                    │
   │   Bearer: <user_jwt>│                   │                    │
   │                     │── check subscription ────────────────►│
   │                     │◄── { active: true, validUntil } ──────│
   │                     │                    │                    │
   │                     │── signAccessJwt({ privateKey,          │
   │                     │   playbackId, expiration: 3600 })      │
   │◄── { accessToken } ─│                   │                    │
   │                     │                    │                    │
   │  Player.Root jwt={accessToken}           │                    │
   │──────────────────────────────────────── video stream ───────►│
   │                     │                    │           validates JWT
   │◄──────────────────────────────────────── video stream ───────│

Who does what:
  Our server:   checks subscription, signs JWT with private key
  MongoDB:      stores subscription, checked on every JWT request
  Livepeer CDN: validates JWT, serves or rejects video
  
  JWT expires in 1 hour — fan must re-request
  Even if fan shares JWT, it expires and is tied to playbackId
```

---

## Auth System

### `web/app/providers.tsx`
```
'use client' — required, PrivyProvider is React Context
Wraps entire app
Config: loginMethods: ['email', 'sms', 'google', 'wallet']
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } }
```

### `web/hooks/useAuth.ts`
```
Combines Privy state + MongoDB user into one hook
Used by: Navbar, all dashboard pages, upload, stream pages

Exports:
  ready           — Privy SDK initialized
  authenticated   — user logged in
  login/logout    — Privy modal
  user            — our MongoDB IUser (null until synced)
  isLoading       — syncing with backend
  syncUser()      — re-sync (called after profile update)

Auto-sync:
  useEffect watches authenticated
  On login → calls syncUser()
  syncUser → POST /api/auth/sync → stores user in state
```

### `web/app/api/auth/sync/route.ts`
```
POST /api/auth/sync
  1. Extract Bearer token from header
  2. privy.verifyAuthToken(token) — throws if expired/invalid
     Uses PRIVY_APP_SECRET from env
  3. connectDB()
  4. User.findOne({ privyId }) or User.create(...)
  5. Check isBanned → 403
  6. Return user document
```

### `web/app/dashboard/layout.tsx`
```
Auth guard for ALL /dashboard/* routes
useEffect:
  !authenticated → redirect to /
  role !== "creator" → redirect to /explore
While loading → spinner
Individual dashboard pages don't need auth checks
```

---

## Video System

### Upload: `web/app/dashboard/upload/page.tsx`
```
State: idle → creating → uploading → done/error

creating phase:
  POST /api/videos → gets tusEndpoint back

uploading phase:
  tus.Upload(file, { endpoint: tusEndpoint })
  Uploads DIRECTLY browser → Livepeer
  Our server not in upload path at all
  onProgress → updates progress bar (0-100%)
  onSuccess → status = 'done'

Key: file never touches our server
     Only metadata (title, playbackId) stored in MongoDB
```

### `web/app/api/videos/route.ts` (POST)
```
1. Verify Privy JWT
2. User must have role: "creator"
3. livepeer.asset.create({ name, playbackPolicy })
   free    → Type.Public (anyone can watch)
   premium → Type.Jwt (requires signed JWT)
4. Video.create({ ..., status: "uploading" })
5. Return { video, tusEndpoint }
```

### `web/app/api/webhooks/livepeer/route.ts`
```
Called by Livepeer when async events happen
Always returns 200 (otherwise Livepeer retries)

asset.ready:
  Video.findOneAndUpdate({ assetId }, { status:"ready", duration })

asset.failed:
  Video.findOneAndUpdate({ assetId }, { status:"failed" })

stream.started:
  Stream.findOneAndUpdate({ streamId }, { status:"live" })

stream.idle:
  Stream.findOneAndUpdate({ streamId }, { status:"ended" })

Local dev: webhook can't reach localhost
  → Manually update status in MongoDB Compass
Production: configure URL in Livepeer Studio dashboard
```

### Player: `web/app/video/[id]/page.tsx`
```
1. GET /api/videos/[id] → video document from MongoDB
2. GET /api/playback/[playbackId] → Livepeer playback info
   Returns: HLS URL, MP4 variants (1080p/720p/360p), thumbnail VTT
3. getSrc(playbackInfo) → Src[] for Player.Root
4. Player components from @livepeer/react/player:
   Player.Root → Player.Container → Player.Video
   Player.Controls:
     Player.Seek (timeline bar)
     Player.PlayPauseTrigger
     Player.MuteTrigger + Player.Volume (slider)
     Player.Time
     Settings popover (@radix-ui/react-popover):
       Player.RateSelect (0.5x - 2x speed)
       Player.VideoQualitySelect (auto/1080p/720p/360p)
     Player.FullscreenTrigger
```

---

## Livestream System

### `web/app/api/streams/route.ts`
```
POST /api/streams
1. Verify JWT → creator only
2. livepeer.stream.create({ name, record: true })
   Returns: id (streamId), streamKey, playbackId
3. Stream.create({ streamId, streamKey, playbackId, ... })
4. Return:
   streamKey     — for RTMP/OBS authentication
   playbackId    — for viewer URL
   rtmpIngestUrl — rtmp://rtmp.livepeer.com/live/[streamKey]
   whipUrl       — https://livepeer.studio/webrtc/[streamKey]
```

### Browser Broadcasting: `web/app/dashboard/stream/page.tsx`
```
Broadcast.Root ingestUrl={whipUrl}
  Uses WebRTC WHIP protocol
  Browser camera/mic → Livepeer via WebRTC
  Sub-1 second latency in production

Components:
  Broadcast.EnabledTrigger — Go Live / Stop
  Broadcast.VideoEnabledTrigger — camera toggle
  Broadcast.AudioEnabledTrigger — mic toggle
  Broadcast.StatusIndicator matcher="live" — LIVE indicator
```

### OBS Broadcasting
```
Creator copies from UI:
  Server:     rtmp://rtmp.livepeer.com/live
  Stream Key: [streamKey]

OBS → RTMP → Livepeer Ingest → CDN
~5-10 second latency (RTMP limitation)
```

### Stream Viewer: `web/app/stream/[playbackId]/page.tsx`
```
GET /api/playback/[playbackId]
Player.Root src={src} lowLatency={true}
  lowLatency=true → tries WebRTC first (low latency)
  Falls back to HLS if WebRTC fails
  (slow network, B-frames from OBS, etc.)
```

---

## Infrastructure Responsibility Map

```
Component          | Who owns it        | Scales how         | Cost model
-------------------|--------------------|--------------------|-----------
Auth/OTP delivery  | Privy              | Automatic          | Per MAU
Video storage      | Livepeer           | Automatic          | Per GB
Video transcoding  | Livepeer           | Automatic          | Per minute
Video CDN delivery | Livepeer           | Automatic          | Per GB
Stream ingest      | Livepeer           | Automatic          | Per minute
Stream CDN         | Livepeer           | Automatic          | Per GB
WebRTC (WHIP/WHEP) | Livepeer           | Automatic          | Per minute
User/video data    | MongoDB Atlas      | Manual (tier up)   | Per cluster
API routes         | Vercel serverless  | Automatic          | Per invocation
Frontend hosting   | Vercel CDN         | Automatic          | Per bandwidth
Payments           | Razorpay           | Automatic          | Per transaction
```

---

## Scaling Thresholds

### When to upgrade what

```
MongoDB Atlas:
  M0 (free)    → dev only, pauses, 512MB
  M10 ($57/mo) → launch, 2GB RAM, ~1000 concurrent connections
  M20 ($200/mo)→ at ~5000 DAU or 50,000 req/day
  Add caching  → delays M20 upgrade significantly

Vercel:
  Free         → dev, 100GB bandwidth
  Pro ($20/mo) → launch, 1TB bandwidth, no function limits
  Enterprise   → at very high traffic (1M+ req/day)

Privy:
  Dev (free)   → 150 users max
  Production   → $0.05/MAU, no manual upgrade needed
  Auto-scales  → nothing to configure

Livepeer:
  Pay per use  → no tiers, no upgrades
  Auto-scales  → nothing to configure
  Bottleneck only if budget runs out
```

### What to add at scale (not built yet)

```
At 1000 DAU:
  → Add Redis caching for /api/creators (Upstash free tier)
    Reduces MongoDB load by ~99% for read-heavy endpoints

At 5000 DAU:
  → Upgrade MongoDB to M20
  → Add rate limiting on API routes (Upstash Redis)
  → Add subscription expiry cron job (Vercel Cron)

At 10,000 DAU:
  → Database read replicas
  → CDN caching for video metadata
  → Separate worker for webhook processing
```

---

## MongoDB Connection

### `web/lib/mongodb.ts`
```
Problem:
  Next.js API routes = serverless functions
  Each cold start = new Node.js process = new DB connection
  Without caching: connection pool exhaustion at scale

Solution:
  Cache on global object:
  global.mongooseCache = { conn: null, promise: null }
  
  If cached.conn exists → return immediately (warm)
  If not → create connection, cache it
  
  Same Node.js instance = reuses connection
  New instance = creates new, caches it
  
  bufferCommands: false
    Fail fast if disconnected
    Better than queued operations timing out in serverless

Atlas network access:
  Dev: your IP only
  Production: 0.0.0.0/0 (allow all)
  Vercel uses dynamic IPs — must allow all
```

---

## Livepeer SDK Notes

### Import paths
```typescript
import { Livepeer } from 'livepeer'                     // server only
import * as Player from '@livepeer/react/player'        // player UI
import * as Broadcast from '@livepeer/react/broadcast'  // broadcast UI
import { getSrc } from '@livepeer/react/external'       // playbackInfo → Src[]
import { Type } from 'livepeer/models/components'       // playback policy enum
import { PlayIcon, PauseIcon, ... } from '@livepeer/react/assets'
```

### Common issues
```
Type not TypeT:
  import { Type } from 'livepeer/models/components'  ✅
  import { TypeT } from ... ← does not exist

Nested data in API response:
  playbackData.data.playbackInfo  ✅
  playbackData.playbackInfo       ← undefined

Broadcast ingestUrl:
  https://livepeer.studio/webrtc/[streamKey]  ✅ (WHIP)
  rtmp://rtmp.livepeer.com/live               ← 404 error

SelectPortal in Popover:
  Use position="popper" on SelectContent + zIndex: 99999
  Without this: dropdown opens behind popover or off-screen
```

---

## Tailwind v4 Config

```
No tailwind.config.ts in v4
All config in web/app/globals.css:

@import "tailwindcss"          ← single import (NOT @tailwind base/components/utilities)

@theme {                       ← generates utility classes
  --color-bg-primary: #0a0a0a  → bg-bg-primary, text-bg-primary
  --color-accent: #f5e642      → bg-accent, text-accent
  --font-display: 'Playfair Display', serif  → font-display
}

@theme inline = CSS variables only, NO utility classes ← wrong
@theme        = CSS variables + utility classes         ← correct

PostCSS config (postcss.config.mjs):
  "@tailwindcss/postcss": {}   ← v4 PostCSS plugin (not tailwindcss directly)
```

---

## Next.js 16 Breaking Changes

```
params is async:
  // Old (Next.js 15)
  export async function GET(req, { params }) {
    const { id } = params  // sync
  }

  // New (Next.js 16) — must await
  export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params  // async
  }

  Applies to: route.ts, page.tsx, layout.tsx

Caching:
  All fetches are uncached by default (changed from v14)
  Explicit: fetch(url, { next: { revalidate: 60 } })
  
proxy.ts replaces middleware.ts for network routing
  (we don't use middleware, so no impact)
```

---

## Known Issues

### Video status not auto-updating locally
```
Cause: Livepeer webhooks need public URL
       localhost:3000 is not reachable from Livepeer servers

Workaround:
  MongoDB Compass → find video → edit → status: "ready"

Production fix:
  Livepeer Studio → Developers → Webhooks
  Add: https://your-domain.vercel.app/api/webhooks/livepeer
  Events: asset.ready, asset.failed, stream.started, stream.idle
```

### MongoDB Atlas M0 pauses
```
Cause: Free tier pauses after ~60min inactivity
Error: MongoServerSelectionError: ReplicaSetNoPrimary

Fix: cloud.mongodb.com → Resume cluster → wait 2-3 min
Production fix: Upgrade to M10 ($57/month)
```

### Premium content JWT not implemented
```
Status: Livepeer assets are created with Type.Jwt for premium
        but JWT signing is not wired up yet

What's needed:
  1. GET /api/jwt/[videoId] route
  2. Check Subscription.findOne({ fan, creator, status:"active" })
  3. signAccessJwt({ publicKey, privateKey, issuer, expiration: 3600 })
     Note: expiration must be number (seconds), not string
  4. Return JWT to frontend
  5. Pass to Player.Root: <Player.Root jwt={accessToken}>
```

---

## Deployment Checklist

```
1. Push all code to GitHub

2. vercel (from web/ directory)
   Set all env variables in Vercel dashboard

3. MongoDB Atlas:
   Network Access → Add IP 0.0.0.0/0
   (Vercel = dynamic IPs, must allow all)
   Upgrade M0 → M10 for production

4. Privy Dashboard:
   Settings → Domains → add production URL
   Upgrade from Dev to Production plan (150 user limit on dev)

5. Google OAuth (if using):
   Google Cloud Console → OAuth client
   Authorized redirect URIs → add:
     https://auth.privy.io/api/v1/oauth/callback
   Authorized JS origins → add production domain

6. Livepeer Webhook:
   livepeer.studio → Developers → Webhooks → New Webhook
   URL: https://your-domain.vercel.app/api/webhooks/livepeer
   Events: asset.ready, asset.failed, stream.started, stream.idle

7. Update Vercel env:
   NEXT_PUBLIC_APP_URL=https://your-production-domain.com

8. Razorpay (when implementing payments):
   Complete KYC + business registration
   Switch from test keys to live keys
   Configure webhook: /api/webhooks/razorpay
```