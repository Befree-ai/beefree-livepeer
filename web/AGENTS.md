<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LyveFree — AI Agent Context

## What is this?
LyveFree is India's first decentralised creator platform for musicians and artists.
Creators keep 92-95% of revenue. No labels. No middlemen.

## Core Tech Stack
- Next.js 16 (App Router, TypeScript)
- MongoDB + Mongoose
- Privy (auth — phone OTP, email, Google OAuth, MPC wallet)
- Livepeer (video upload, streaming, livestream via TUS + WebRTC/RTMP)
- Razorpay (India payments — UPI, cards, netbanking)
- Cloudinary (avatar image upload + CDN)
- Tailwind CSS v4 + framer-motion
- Deployed on Vercel

## Design System
- Background: #080808 (warm near-black)
- Primary accent: #E8B84B (gold) — `var(--color-accent)`
- Secondary accent: #E8348A (magenta/pink) — `var(--color-pink)`
- Fonts: Plus Jakarta Sans (display) + Inter (body)
- All colors via CSS variables in `globals.css`

## Two User Types
- **Fan**: watches content, subscribes to creators, follows creators
- **Creator**: uploads videos, goes live, earns money. Must apply via /apply and get approved by admin.

## Key Conventions
- All API routes in `app/api/`
- Reusable components in `components/`
- MongoDB schemas in `models/`
- TypeScript types in `types/index.ts`
- SDK clients in `lib/`
- Never expose API keys in frontend
- Backend API calls use server-side only
- Amounts stored in paise (₹1 = 100 paise)
- Large numbers formatted via `formatCount()` (15600000 → "15.6M")

## Folder Structure
web/
├── app/              # Next.js pages + API routes
├── components/
│   ├── landing/      # Modular landing page sections
│   ├── layout/       # Navbar, Footer
│   └── ui/           # Button, Badge, FadeUp, Counter, ImgPlaceholder, VideoPlaceholder
├── lib/              # SDK clients (mongodb, livepeer)
├── models/           # Mongoose schemas (User, Video, Stream, Subscription, CreatorApplication)
├── types/            # TypeScript types
└── hooks/            # useAuth (Privy + MongoDB user)

## Important Notes
- Browser streaming (WebRTC) works on Brave/Firefox. Chrome sends B-frames → use Brave or OBS
- WHIP URL must use `playback.livepeer.studio` not `livepeer.studio`
- `lowLatency={false}` on viewer Player to force HLS
- Livepeer JWT `expiration` is duration in seconds (3600), NOT unix timestamp
- Cloudinary avatar upload at `/api/upload`
- Creator application flow: /apply → /admin approval → role set to "creator"
- Admin identified by NEXT_PUBLIC_ADMIN_EMAIL or NEXT_PUBLIC_ADMIN_PRIVY_ID env vars
