# BeeFree — Technical Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [All Systems Involved](#all-systems-involved)
3. [File Structure](#file-structure)
4. [Data Models](#data-models)
5. [API Routes](#api-routes)
6. [Infrastructure Map](#infrastructure-map)
7. [Scaling Thresholds](#scaling-thresholds)

---

## System Overview

BeeFree is a Next.js 16 application deployed on Vercel. It uses the App Router pattern where:

- **Pages** (`app/*/page.tsx`) — React components that run in the browser
- **API routes** (`app/api/*/route.ts`) — serverless functions that run on Vercel's servers
- **Models** (`models/*.ts`) — Mongoose schemas that define MongoDB collections

The key insight of the architecture: **video files never pass through our servers**. The browser uploads directly to Livepeer, and Livepeer's CDN serves video directly to viewers. Our server only handles metadata (titles, access control, subscriptions).

---

## All Systems Involved

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (React)                          │
│  Next.js pages + components running in user's browser           │
└──────────┬───────────────────────────────────────────┬──────────┘
           │ API calls (JSON)                          │ Video (TUS/HLS/WebRTC)
           ▼                                           ▼
┌──────────────────────┐                 ┌─────────────────────────┐
│   OUR SERVER         │                 │   LIVEPEER              │
│   (Vercel Serverless)│◄───────────────►│   (Video Infrastructure)│
│                      │   SDK calls     │                         │
│   app/api/**         │                 │   - Asset storage       │
│   route.ts files     │                 │   - Transcoding         │
│                      │                 │   - CDN delivery        │
└──────────┬───────────┘                 │   - Stream ingest       │
           │                             │   - Webhooks            │
           │ Mongoose queries             └─────────────────────────┘
           ▼
┌──────────────────────┐                 ┌─────────────────────────┐
│   MONGODB ATLAS      │                 │   PRIVY                 │
│   (Database)         │                 │   (Auth)                │
│                      │                 │                         │
│   - users            │                 │   - OTP delivery        │
│   - videos           │                 │   - JWT issuance        │
│   - streams          │                 │   - Google OAuth        │
│   - subscriptions    │                 │   - Wallet auth         │
└──────────────────────┘                 └─────────────────────────┘

                                         ┌─────────────────────────┐
                                         │   RAZORPAY              │
                                         │   (Payments)            │
                                         │                         │
                                         │   - Order creation      │
                                         │   - Payment processing  │
                                         │   - UPI/Cards/Netbanking│
                                         │   - Webhooks            │
                                         └─────────────────────────┘
```

---

## File Structure

```
web/
├── app/
│   ├── api/                           ← All backend (serverless functions on Vercel)
│   │   ├── auth/sync/route.ts         ← POST: Privy JWT verify + MongoDB user sync
│   │   ├── creators/route.ts          ← GET: list all creators
│   │   ├── creators/[id]/route.ts     ← GET: single creator + their videos
│   │   ├── videos/route.ts            ← GET: video feed | POST: create Livepeer asset
│   │   ├── videos/[id]/route.ts       ← GET: single video | PATCH: update video
│   │   ├── videos/[id]/jwt/route.ts   ← GET: sign Livepeer JWT for premium video
│   │   ├── playback/[id]/route.ts     ← GET: Livepeer playback info
│   │   ├── streams/route.ts           ← POST: create stream | GET: by playbackId
│   │   ├── profile/route.ts           ← PATCH: update user profile
│   │   ├── subscriptions/route.ts     ← POST: create Razorpay order | GET: check sub
│   │   ├── subscriptions/verify/      ← POST: verify Razorpay payment
│   │   └── webhooks/
│   │       ├── livepeer/route.ts      ← POST: handle Livepeer events
│   │       └── razorpay/route.ts      ← POST: handle Razorpay payment events
│   │
│   ├── creator/[id]/page.tsx          ← Public creator profile + subscribe button
│   ├── explore/page.tsx               ← Browse all creators
│   ├── video/[id]/page.tsx            ← Watch a video (free or premium)
│   ├── stream/[playbackId]/page.tsx   ← Watch a live stream
│   │
│   ├── dashboard/                     ← Protected — creators only
│   │   ├── layout.tsx                 ← Auth guard: must be logged in + creator role
│   │   ├── page.tsx                   ← Stats overview
│   │   ├── upload/page.tsx            ← Upload a video
│   │   ├── videos/page.tsx            ← Manage uploaded videos
│   │   ├── stream/page.tsx            ← Go live (browser or OBS)
│   │   └── profile/page.tsx          ← Edit profile + set subscription price
│   │
│   ├── layout.tsx                     ← Root layout — wraps app with PrivyProvider
│   ├── providers.tsx                  ← PrivyProvider ('use client' wrapper)
│   └── globals.css                    ← Tailwind v4 @theme tokens
│
├── components/
│   ├── layout/Navbar.tsx              ← Fixed top nav, auth state aware
│   ├── layout/Footer.tsx
│   └── ui/
│       ├── Button.tsx                 ← primary/secondary/ghost/danger variants
│       └── Badge.tsx                 ← live/free/premium/verified/default
│
├── hooks/
│   └── useAuth.ts                     ← Combines Privy state + MongoDB user
│
├── lib/
│   ├── mongodb.ts                     ← Mongoose connection with serverless caching
│   └── livepeer.ts                    ← Livepeer SDK singleton (server-side only)
│
├── models/
│   ├── User.ts                        ← Users (fans + creators, same collection)
│   ├── Video.ts                       ← Uploaded videos
│   ├── Stream.ts                      ← Livestreams
│   └── Subscription.ts               ← Fan→Creator subscriptions
│
└── types/index.ts                     ← All shared TypeScript interfaces
```

---

## Data Models

### User (`web/models/User.ts`)

One collection for both fans and creators. Creator-specific fields are empty for fans.

```typescript
{
  _id: ObjectId                    // MongoDB auto-generated ID
  privyId: string                  // "did:privy:xxx" — primary lookup key
                                   // INDEXED + UNIQUE
  email?: string                   // UNIQUE + SPARSE (allows multiple nulls)
  phone?: string                   // UNIQUE + SPARSE
  name: string                     // display name
  avatar: string                   // profile picture URL
  role: "fan" | "creator"          // INDEXED — queried frequently
  bio: string                      // max 500 chars
  isBanned: boolean                // checked on every auth sync
  isVerified: boolean              // set manually by BeeFree team

  // Creator-only fields (empty/default for fans):
  genre: string[]                  // ["Bollywood", "Indie", ...]
  socialLinks: {
    instagram: string
    twitter: string
    youtube: string
  }
  followersCount: number
  followingCount: number
  totalEarnings: number            // in paise (₹1 = 100 paise)
  subscriptionPrice: number        // in paise, default 9900 (₹99)

  createdAt: Date                  // auto by mongoose timestamps
  updatedAt: Date
}
```

**Why one collection for fans and creators?**
A fan can become a creator later. Keeping them in one collection means we just update `role: "creator"` instead of migrating data between collections.

---

### Video (`web/models/Video.ts`)

```typescript
{
  _id: ObjectId
  title: string                    // max 200 chars
  description: string              // max 2000 chars
  playbackId: string               // UNIQUE — Livepeer ID viewers use to watch
  assetId: string                  // UNIQUE — Livepeer ID for managing the asset
  thumbnailUrl: string             // set by Livepeer after processing
  duration: number                 // seconds — set by Livepeer webhook
  creator: ObjectId                // ref: User — INDEXED
  access: "free" | "premium"
  status: "uploading" | "processing" | "ready" | "failed"  // INDEXED
  viewCount: number
  likes: number
  tags: string[]

  createdAt: Date
  updatedAt: Date
}

// Compound indexes:
// { creator: 1, createdAt: -1 }  — "get creator's videos newest first"
// { status: 1, access: 1 }       — "get all ready free videos for explore"
```

**Two Livepeer IDs explained:**
- `assetId` — internal Livepeer ID, used for management (delete, update)
- `playbackId` — public ID, used in video player URLs
Both are required and both are unique.

---

### Stream (`web/models/Stream.ts`)

```typescript
{
  _id: ObjectId
  title: string
  description: string
  streamId: string                 // UNIQUE — Livepeer internal stream ID
  streamKey: string                // UNIQUE — secret key for RTMP auth
  playbackId: string               // UNIQUE — public ID for viewers
  creator: ObjectId                // ref: User — INDEXED
  access: "free" | "premium"
  status: "idle" | "live" | "ended"  // INDEXED
  viewerCount: number
  recordingPlaybackId: string      // set after stream ends if recorded
  scheduledAt?: Date

  createdAt: Date
  updatedAt: Date
}

// Index: { creator: 1, status: 1 }  — "get creator's live streams"
```

**Three stream IDs explained:**
- `streamId` — Livepeer's internal ID for managing the stream
- `streamKey` — secret key the broadcaster uses to authenticate (RTMP)
- `playbackId` — public ID viewers use to watch

---

### Subscription (`web/models/Subscription.ts`)

```typescript
{
  _id: ObjectId
  fan: ObjectId                    // ref: User
  creator: ObjectId                // ref: User
  status: "active" | "expired" | "cancelled"
  planType: "monthly" | "yearly"
  razorpayOrderId: string          // set when payment initiated
  razorpayPaymentId: string        // set after payment confirmed
  amount: number                   // in paise (₹99 = 9900)
  validUntil: Date                 // subscription expiry date

  createdAt: Date
}

// Critical indexes:
// { fan: 1, creator: 1 }        — "is fan X subscribed to creator Y?"
//                                  runs on EVERY premium content page load
// { status: 1, validUntil: 1 } — for future expiry cron job
```

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/sync` | Verify Privy JWT, create/find user in MongoDB |

### Videos
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/videos` | Create Livepeer asset, save to MongoDB |
| GET | `/api/videos` | Get video feed (or creator's own videos) |
| GET | `/api/videos/[id]` | Get single video |
| GET | `/api/videos/[id]/jwt` | Get signed Livepeer JWT for premium video |
| GET | `/api/playback/[playbackId]` | Get Livepeer playback info (HLS URLs) |

### Streams
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/streams` | Create Livepeer stream, save to MongoDB |
| GET | `/api/streams?playbackId=xxx` | Get stream by playbackId |

### Subscriptions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/subscriptions` | Create Razorpay order |
| GET | `/api/subscriptions?creatorId=xxx` | Check if user is subscribed |
| POST | `/api/subscriptions/verify` | Verify Razorpay payment, activate subscription |

### Profile
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/api/profile` | Update user profile + subscription price |

### Webhooks
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/webhooks/livepeer` | Handle asset.ready, stream.started etc. |
| POST | `/api/webhooks/razorpay` | Backup payment confirmation |

---

## Infrastructure Map

Who owns what, and what scales automatically vs manually:

```
Component           │ Owner      │ Scales     │ Cost model
────────────────────┼────────────┼────────────┼──────────────────
Auth / OTP delivery │ Privy      │ Automatic  │ Per MAU
Video storage       │ Livepeer   │ Automatic  │ Per GB stored
Video transcoding   │ Livepeer   │ Automatic  │ Per minute transcoded
Video CDN delivery  │ Livepeer   │ Automatic  │ Per GB delivered
Stream ingest       │ Livepeer   │ Automatic  │ Per minute streamed
Stream CDN          │ Livepeer   │ Automatic  │ Per GB delivered
WebRTC (browser)    │ Livepeer   │ Automatic  │ Per minute
User/video metadata │ MongoDB    │ Manual ⚠️  │ Per cluster tier
API routes          │ Vercel     │ Automatic  │ Per invocation
Frontend hosting    │ Vercel CDN │ Automatic  │ Per bandwidth
Payments            │ Razorpay   │ Automatic  │ Per transaction (2%)
```

The only thing that needs manual scaling is MongoDB. Everything else scales automatically or is pay-per-use.

---

## Scaling Thresholds

### MongoDB Atlas
```
M0 (free)    → dev only. 512MB, pauses after ~60min inactivity
M10 ($57/mo) → launch. 2GB RAM, ~1000 concurrent connections
M20 ($200/mo)→ at ~5000 DAU or 50,000 requests/day
```

### Vercel
```
Free ($0)    → dev. 100GB bandwidth, function limits
Pro ($20/mo) → launch. 1TB bandwidth, no limits
```

### Privy
```
Dev (free)   → max 150 users. Good for development only
Production   → $0.05/MAU, auto-scales, no upgrade needed
```

### Livepeer
```
No tiers — pure pay per use
~$0.005/min transcoding
~$0.0025/GB CDN delivery
Auto-scales — nothing to configure
```

### When to add caching (Redis/Upstash)
At 1000 DAU, add a Redis cache in front of `/api/creators`. This converts 1000 concurrent MongoDB queries into 1 query per minute. Free tier on Upstash handles this easily.

---

## Key Technical Decisions

### Why Next.js API routes instead of separate backend?
At our scale, serverless functions are cheaper and simpler. We don't need a dedicated Express server running 24/7. Each API call spins up a function, runs, and stops.

### Why Privy instead of custom auth?
Auth is complex — OTP delivery, JWT management, wallet connections, OAuth. Privy handles all of this. Building it ourselves would take months and introduce security risks.

### Why Livepeer instead of AWS S3 + CloudFront?
Livepeer is specifically built for video — it handles transcoding to multiple resolutions (1080p/720p/360p), HLS packaging, global CDN, and livestream infrastructure. Using S3 would require building all of this ourselves.

### Why store amounts in paise?
Indian currency. ₹1 = 100 paise. Storing in paise (integers) avoids floating point precision issues. ₹99 = `9900`, ₹199 = `19900`. All payment calculations are done in paise and converted to rupees only for display.

### Why MongoDB over PostgreSQL?
Our data is document-oriented — a user document contains their social links, genre array, etc. MongoDB's flexible schema makes it easy to add fields without migrations. For a startup moving fast, this matters.