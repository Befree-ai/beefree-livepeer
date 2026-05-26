@AGENTS.md

## Auth Flow
Privy login → useAuth syncs to MongoDB (/api/auth/sync) → user doc returned → role determines access. walletAddress extracted from Privy MPC wallet.

## Creator Application Flow
Fan visits /apply → submits form → CreatorApplication saved (pending) → Admin at /admin approves → user.role set to "creator" → user re-logs in → Dashboard unlocked.

## Video Upload Flow
Creator uploads → /api/videos creates Livepeer asset (TUS endpoint) → browser uploads file directly to Livepeer → webhook asset.ready → MongoDB updated (status: ready, thumbnailUrl, duration) → viewCount incremented on every video page load.

## Video Playback Flow
Free videos: getSrc(playbackInfo) → Player.Root. Premium videos: fetch JWT from /api/videos/[id]/jwt (checks subscription) → set JWT before src → Player.Root with jwt prop → Livepeer CDN validates JWT on every segment.

## Livestream Flow
Creator → /api/streams creates Livepeer stream → browser uses Broadcast.Root with WHIP URL (playback.livepeer.studio) → works on Brave/Firefox (not Chrome). Viewer: /stream/[playbackId] → check access → Player.Root with lowLatency={false}.

## Subscription Flow
Fan clicks subscribe → /api/subscriptions creates Razorpay order → Razorpay checkout popup → payment → /api/subscriptions/verify verifies HMAC signature → subscription activated → premium content unlocked.

## Follow Flow
POST/DELETE /api/follow/[creatorId] → updates fan.following array + followersCount + followingCount → feed prioritises followed creators.

## Avatar Upload Flow
Creator selects image in /dashboard/profile → preview shown immediately → POST /api/upload (FormData) → Cloudinary upload (400×400 face crop) → URL saved to user.avatar in MongoDB → syncUser() refreshes context.

## Admin Flow
/admin page → identified by env vars → GET /api/admin for stats/applications/subscriptions → POST /api/admin with { applicationId, action } → approve sets role to "creator".

## Number Formatting
formatCount(15600000) → "15.6M", formatCount(847000) → "847K". Used for follower counts on creator profiles.

## Design Tokens
Gold: var(--color-accent) = #E8B84B
Pink: var(--color-pink) = #E8348A
Background: var(--color-bg-primary) = #080808
Surface: var(--color-bg-surface)
Elevated: var(--color-bg-elevated)
