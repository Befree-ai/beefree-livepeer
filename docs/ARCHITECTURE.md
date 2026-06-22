# LyveFree — Technical Architecture

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

LyveFree is a Next.js 16 application deployed on Vercel. It uses the App Router pattern where:

- **Pages** (`app/*/page.tsx`) — React components that run in the browser
- **API routes** (`app/api/*/route.ts`) — serverless functions that run on Vercel's servers
- **Models** (`models/*.ts`) — Mongoose schemas that define MongoDB collections

The key insight of the architecture: **video files never pass through our servers**. The browser uploads directly to Livepeer, and Livepeer's CDN serves video directly to viewers. Our server only handles metadata (titles, access control, subscriptions).

---

## All Systems Involved
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
│   - subscriptions    │                 │   - MPC Wallet          │
│   - creatorApplications                └─────────────────────────┘
└──────────────────────┘
┌─────────────────────────┐
│   RAZORPAY              │
│   (Payments)            │
│                         │
│   - Order creation      │
│   - Payment processing  │
│   - UPI/Cards/Netbanking│
│   - Webhooks            │
└─────────────────────────┘
                                     ┌─────────────────────────┐
                                     │   CLOUDINARY            │
                                     │   (Image Storage)       │
                                     │                         │
                                     │   - Avatar upload       │
                                     │   - Image CDN           │
                                     │   - Auto optimization   │
                                     └─────────────────────────┘

---

## File Structure
web/
├── app/
│   ├── api/                                ← All backend (serverless functions on Vercel)
│   │   ├── admin/route.ts                  ← GET: stats + applications + subscriptions | POST: approve/reject
│   │   ├── auth/sync/route.ts              ← POST: Privy JWT verify + MongoDB user sync
│   │   ├── creator-application/route.ts   ← GET: check status | POST: submit application
│   │   ├── creators/route.ts               ← GET: list all creators
│   │   ├── creators/[id]/route.ts          ← GET: single creator + their videos
│   │   ├── cron/expire-subscriptions/      ← GET: expire old subscriptions (cron job)
│   │   ├── earnings/route.ts               ← GET: creator earnings + subscribers
│   │   ├── feed/route.ts                   ← GET: personalised video feed
│   │   ├── follow/[creatorId]/route.ts     ← GET: check follow | POST: follow | DELETE: unfollow
│   │   ├── playback/[id]/route.ts          ← GET: Livepeer playback info
│   │   ├── profile/route.ts                ← PATCH: update user profile
│   │   ├── streams/route.ts                ← POST: create stream | GET: by playbackId
│   │   ├── subscriptions/route.ts          ← POST: create Razorpay order | GET: check sub
│   │   ├── subscriptions/verify/           ← POST: verify Razorpay payment
│   │   ├── upload/route.ts                 ← POST: upload avatar to Cloudinary
│   │   ├── users/[id]/route.ts             ← GET: fan profile + following list
│   │   ├── videos/route.ts                 ← GET: video feed | POST: create Livepeer asset
│   │   ├── videos/[id]/route.ts            ← GET: single video (increments viewCount) | PATCH: update
│   │   ├── videos/[id]/jwt/route.ts        ← GET: sign Livepeer JWT for premium video
│   │   └── webhooks/
│   │       ├── livepeer/route.ts           ← POST: handle Livepeer events (asset.ready, stream.started etc.)
│   │       └── razorpay/route.ts           ← POST: handle Razorpay payment events
│   │
│   ├── admin/page.tsx                      ← Admin panel — stats, applications, subscriptions
│   ├── apply/page.tsx                      ← Creator application form
│   ├── creator/[id]/page.tsx               ← Public creator profile + subscribe + follow
│   ├── explore/page.tsx                    ← Browse all creators
│   ├── feed/page.tsx                       ← Personalised video feed
│   ├── profile/[id]/page.tsx               ← Fan profile + following list + wallet
│   ├── video/[id]/page.tsx                 ← Watch a video (free or premium)
│   ├── stream/[playbackId]/page.tsx        ← Watch a live stream
│   │
│   ├── dashboard/                          ← Protected — creators only
│   │   ├── layout.tsx                      ← Auth guard: must be logged in + creator role
│   │   ├── page.tsx                        ← Stats overview + wallet + quick actions
│   │   ├── earnings/page.tsx               ← Revenue + subscriber list
│   │   ├── profile/page.tsx                ← Edit profile + avatar upload + subscription price
│   │   ├── upload/page.tsx                 ← Upload a video
│   │   ├── videos/page.tsx                 ← Manage uploaded videos
│   │   └── stream/page.tsx                 ← Go live (browser WebRTC or OBS RTMP)
│   │
│   ├── layout.tsx                          ← Root layout — wraps app with PrivyProvider
│   ├── providers.tsx                       ← PrivyProvider ('use client' wrapper)
│   └── globals.css                         ← Design system: gold/magenta theme, Plus Jakarta Sans
│
├── components/
│   ├── landing/                            ← Landing page sections (modular)
│   │   ├── HeroSection.tsx                 ← Hero with animated orbs + creator card demo
│   │   ├── MarqueeStrip.tsx                ← Scrolling genre names
│   │   ├── StatsSection.tsx                ← 92% / ₹0 / 100% stat cards
│   │   ├── PlatformPreview.tsx             ← Platform demo video placeholder
│   │   ├── RevenueComparison.tsx           ← Animated bar chart vs labels/Spotify/YouTube
│   │   ├── HowItWorks.tsx                  ← 3-step guide
│   │   ├── TokenEconomy.tsx                ← Token system explainer
│   │   ├── CreatorSpotlight.tsx            ← Creator cards grid
│   │   ├── TechStack.tsx                   ← Livepeer / Ethereum / Privy
│   │   └── FinalCTA.tsx                    ← Bottom CTA section
│   ├── layout/
│   │   ├── Navbar.tsx                      ← Fixed top nav, auth state aware
│   │   └── Footer.tsx
│   └── ui/
│       ├── Badge.tsx                       ← live/free/premium/verified/default variants
│       ├── Button.tsx                      ← primary/secondary/ghost/danger variants
│       ├── Counter.tsx                     ← Animated scroll-triggered number counter
│       ├── FadeUp.tsx                      ← Reusable framer-motion fade up wrapper
│       ├── ImgPlaceholder.tsx              ← Placeholder for images not yet uploaded
│       └── VideoPlaceholder.tsx            ← Placeholder for demo video
│
├── hooks/
│   └── useAuth.ts                          ← Combines Privy state + MongoDB user + walletAddress
│
├── lib/
│   ├── mongodb.ts                          ← Mongoose connection with serverless caching
│   └── livepeer.ts                         ← Livepeer SDK singleton (server-side only)
│
├── models/
│   ├── User.ts                             ← Users (fans + creators, same collection)
│   ├── Video.ts                            ← Uploaded videos
│   ├── Stream.ts                           ← Livestreams
│   ├── Subscription.ts                     ← Fan→Creator subscriptions
│   └── CreatorApplication.ts              ← Creator application submissions
│
└── types/index.ts                          ← All shared TypeScript interfaces

---

## Data Models

### User (`web/models/User.ts`)

One collection for both fans and creators. Creator-specific fields are empty for fans.

```typescript
{
  _id: ObjectId
  privyId: string                  // "did:privy:xxx" — primary lookup key. INDEXED + UNIQUE
  email?: string                   // UNIQUE + SPARSE (allows multiple nulls)
  phone?: string                   // UNIQUE + SPARSE
  name?: string                    // display name
  avatar?: string                  // Cloudinary URL or empty string
  role: "fan" | "creator"          // INDEXED — queried frequently
  bio?: string                     // max 500 chars
  isBanned: boolean
  isVerified: boolean              // set manually by LyveFree
  // team (shows verified badge)
  walletAddress?: string           // Ethereum wallet address from Privy MPC

  // Follow system
  following: string[]              // array of creator _id strings
  followersCount: number
  followingCount: number

  // Creator-only fields (empty/default for fans):
  genre: string[]                  // ["Bollywood", "Indie", ...]
  socialLinks: {
    instagram: string
    twitter: string
    youtube: string
  }
  totalEarnings: number            // in paise (₹1 = 100 paise)
  subscriptionPrice: number        // in paise, default 9900 (₹99)

  createdAt: Date
  updatedAt: Date
}
```

---

### Video (`web/models/Video.ts`)

```typescript
{
  _id: ObjectId
  title: string
  description: string
  playbackId: string               // UNIQUE — Livepeer ID viewers use to watch
  assetId: string                  // UNIQUE — Livepeer ID for managing the asset
  thumbnailUrl: string             // set by Livepeer webhook (asset.ready)
  duration: number                 // seconds — set by Livepeer webhook
  creator: ObjectId                // ref: User — INDEXED
  access: "free" | "premium"
  status: "uploading" | "processing" | "ready" | "failed"
  viewCount: number                // incremented on every /api/videos/[id] GET
  likes: number
  tags: string[]

  createdAt: Date
  updatedAt: Date
}
```

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
  status: "idle" | "live" | "ended"
  viewerCount: number
  recordingPlaybackId: string
  scheduledAt?: Date

  createdAt: Date
  updatedAt: Date
}
```

---

### Subscription (`web/models/Subscription.ts`)

```typescript
{
  _id: ObjectId
  fan: ObjectId                    // ref: User
  creator: ObjectId                // ref: User
  status: "active" | "expired" | "cancelled"
  planType: "monthly" | "yearly"
  razorpayOrderId: string
  razorpayPaymentId: string
  amount: number                   // in paise
  validUntil: Date

  createdAt: Date
}

// Indexes:
// { fan: 1, creator: 1 }        — "is fan X subscribed to creator Y?"
// { status: 1, validUntil: 1 } — for cron expiry job
```

---

### CreatorApplication (`web/models/CreatorApplication.ts`)

```typescript
{
  _id: ObjectId
  user: ObjectId                   // ref: User — the applicant
  name: string                     // artist/stage name
  bio: string
  genre: string[]
  instagramHandle: string
  sampleWorkUrl: string            // YouTube, SoundCloud, Spotify etc.
  status: "pending" | "approved" | "rejected"

  createdAt: Date
  updatedAt: Date
}
```

---

## API Routes

### Authentication
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/sync` | Privy JWT | Verify Privy JWT, create/find user in MongoDB, return user doc |

### Creator Applications
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/creator-application` | Required | Check if user has applied + status |
| POST | `/api/creator-application` | Required | Submit creator application |

### Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin?section=overview` | Admin only | Platform stats |
| GET | `/api/admin?section=applications` | Admin only | Pending applications |
| GET | `/api/admin?section=subscriptions` | Admin only | All subscriptions |
| POST | `/api/admin` | Admin only | Approve or reject application |

### Videos
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/videos` | Creator only | Create Livepeer asset, save to MongoDB |
| GET | `/api/videos` | Optional | Get video feed or creator's own videos |
| GET | `/api/videos/[id]` | Optional | Get single video + increment viewCount |
| GET | `/api/videos/[id]/jwt` | Required | Get signed Livepeer JWT for premium video |
| GET | `/api/playback/[playbackId]` | None | Get Livepeer playback info |

### Streams
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/streams` | Creator only | Create Livepeer stream, save to MongoDB |
| GET | `/api/streams?playbackId=xxx` | None | Get stream by playbackId |

### Subscriptions
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/subscriptions` | Required | Create Razorpay order |
| GET | `/api/subscriptions?creatorId=xxx` | Required | Check if user is subscribed |
| POST | `/api/subscriptions/verify` | Required | Verify Razorpay payment, activate subscription |

### Follow System
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/follow/[creatorId]` | Required | Check if following |
| POST | `/api/follow/[creatorId]` | Required | Follow a creator |
| DELETE | `/api/follow/[creatorId]` | Required | Unfollow a creator |

### Creators & Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/creators` | None | List all creators |
| GET | `/api/creators/[id]` | None | Single creator + their videos |
| GET | `/api/users/[id]` | None | Fan profile + following list |

### Profile & Upload
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PATCH | `/api/profile` | Required | Update user profile + subscription price |
| POST | `/api/upload` | Required | Upload avatar image to Cloudinary |

### Feed & Earnings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/feed` | Optional | Personalised feed (following-first) |
| GET | `/api/earnings` | Creator only | Revenue stats + subscriber list |

### Webhooks & Cron
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/webhooks/livepeer` | Livepeer signature | Handle asset.ready, stream.started etc. |
| POST | `/api/webhooks/razorpay` | Razorpay signature | Backup payment confirmation |
| GET | `/api/cron/expire-subscriptions` | Cron secret | Mark expired subscriptions |

---

## Infrastructure Map
Component             │ Owner       │ Scales     │ Cost model
──────────────────────┼─────────────┼────────────┼──────────────────
Auth / OTP delivery   │ Privy       │ Automatic  │ Per MAU
MPC Wallet            │ Privy       │ Automatic  │ Included
Video storage         │ Livepeer    │ Automatic  │ Per GB stored
Video transcoding     │ Livepeer    │ Automatic  │ Per minute
Video CDN delivery    │ Livepeer    │ Automatic  │ Per GB delivered
Stream ingest         │ Livepeer    │ Automatic  │ Per minute streamed
Stream CDN            │ Livepeer    │ Automatic  │ Per GB delivered
WebRTC (browser)      │ Livepeer    │ Automatic  │ Per minute
Avatar images         │ Cloudinary  │ Automatic  │ Per GB stored/delivered
User/video metadata   │ MongoDB     │ Manual ⚠️  │ Per cluster tier
API routes            │ Vercel      │ Automatic  │ Per invocation
Frontend hosting      │ Vercel CDN  │ Automatic  │ Per bandwidth
Payments              │ Razorpay    │ Automatic  │ Per transaction (2%)

---

## Scaling Thresholds

### MongoDB Atlas
M0 (free)    → dev only. 512MB, pauses after ~60min inactivity
M10 ($57/mo) → launch. 2GB RAM, ~1000 concurrent connections
M20 ($200/mo)→ at ~5000 DAU or 50,000 requests/day

### Vercel
Free ($0)    → dev. 100GB bandwidth, function limits
Pro ($20/mo) → launch. 1TB bandwidth, no limits

### Cloudinary
Free         → 25GB storage, 25GB bandwidth/month
Plus ($89/mo)→ at scale

### Privy
Dev (free)   → max 150 users
Production   → $0.05/MAU, auto-scales

### Livepeer
No tiers — pure pay per use
~$0.005/min transcoding
~$0.0025/GB CDN delivery

---

## Key Technical Decisions

### Why Next.js API routes instead of separate backend?
At our scale, serverless functions are cheaper and simpler. No dedicated Express server running 24/7.

### Why Privy instead of custom auth?
Auth is complex — OTP delivery, JWT management, wallet connections, OAuth. Privy handles all of this including MPC wallets so every user gets a self-custodial Ethereum wallet automatically.

### Why Livepeer instead of AWS S3 + CloudFront?
Livepeer is specifically built for video — transcoding to multiple resolutions, HLS packaging, global CDN, and livestream infrastructure all included.

### Why Cloudinary for avatars?
Free tier handles our scale. Auto image optimization (WebP conversion, resizing, face-crop). Fast global CDN. 5-minute integration.

### Why store amounts in paise?
Indian currency. ₹1 = 100 paise. Integers avoid floating point precision issues. ₹99 = `9900`.

### Why MongoDB over PostgreSQL?
Document-oriented data (genre arrays, social links object). Flexible schema for fast iteration. Easy to add fields without migrations.

### Creator role assignment
Creators apply via `/apply` page → admin approves via `/admin` → role set to `"creator"` automatically. Previously required manual MongoDB edits.
