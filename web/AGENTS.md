<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# BeeFree — AI Agent Context

## What is this?
BeeFree is an India-first decentralized creator platform for musicians and artists.
Think "YouTube but creators keep 92-95% instead of 55%".

## Core Tech Stack
- Next.js 16 (App Router, TypeScript)
- MongoDB + Mongoose
- Privy (auth — phone OTP, email, wallet)
- Livepeer (video upload, streaming, livestream)
- Razorpay (India payments — UPI, cards)
- Tailwind CSS
- Deployed on Vercel

## Two User Types
- Fan: watches content, subscribes to creators
- Creator: uploads videos, goes live, earns money

## Key Conventions
- All API routes in app/api/
- Reusable components in components/
- MongoDB schemas in models/
- TypeScript types in types/index.ts
- SDK clients in lib/
- Never expose API keys in frontend
- Backend API calls use server-side only

## Environment Variables
See .env.example for required variables.
Never commit .env.local

## Folder Structure
web/
├── app/              # Next.js pages + API routes
├── components/       # Reusable React components
├── lib/              # SDK clients, utilities
├── models/           # Mongoose schemas
├── types/            # TypeScript types
└── hooks/            # Custom React hooks