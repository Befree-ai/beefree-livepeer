# Video Playback Flow

How a viewer watches a video — free videos play immediately, premium videos require a subscription and a signed JWT.

---

## Overview

There are two types of videos:
- **Free** (`access: "free"`) — Livepeer CDN serves to anyone. No auth needed.
- **Premium** (`access: "premium"`) — Livepeer CDN requires a signed JWT. Only subscribers can get this JWT from our server.

---

## Systems Involved

```
Browser             Our Server          Livepeer CDN        MongoDB
  │                     │                    │                  │
  ▼                     ▼                    ▼                  ▼
video/[id]/page.tsx  videos/[id]/jwt/    HLS stream         Video model
Player.Root          route.ts            validates JWT      Subscription model
```

---

## Free Video Flow

### Step 1 — Page Loads, Fetches Video

**File:** `web/app/video/[id]/page.tsx`

```typescript
useEffect(() => {
  if (!id) return

  fetch(`/api/videos/${id}`)
    .then(r => r.json())
    .then(async (data) => {
      setVideo(data.data)  // video document from MongoDB

      // Fetch Livepeer playback info
      const playbackRes = await fetch(`/api/playback/${data.data.playbackId}`)
      const playbackData = await playbackRes.json()

      if (data.data.access === 'premium') {
        // Premium flow — handled below
      } else {
        // Free video — set src directly
        if (playbackData.success) {
          setSrc(getSrc(playbackData.data.playbackInfo))
        }
      }
    })
}, [id])
```

### Step 2 — Get Playback Info from Livepeer

**File:** `web/app/api/playback/[playbackId]/route.ts`

This route calls Livepeer's API to get the playback URLs:
```typescript
const info = await livepeer.playback.get(playbackId)
// Returns: HLS manifest URL, MP4 variants, thumbnail sprites
```

The `getSrc()` function (from `@livepeer/react/external`) converts Livepeer's playback info into a format the Player component understands.

### Step 3 — Player Renders

```typescript
<Player.Root src={src} autoPlay volume={0}>
  <Player.Container>
    <Player.Video />
    {/* ... controls */}
  </Player.Container>
</Player.Root>
```

For free videos, `jwt` prop is not passed (or is `undefined`). Livepeer CDN serves the HLS stream directly to the browser. No token needed.

---

## Premium Video Flow

### Step 1 — Page Detects Premium Access

Same `useEffect` as above, but takes the `premium` branch:

```typescript
if (data.data.access === 'premium') {
  // Must get JWT before setting src
  // If we set src first, player tries to play without JWT → 401
  const token = await getAccessToken()  // Privy JWT
  if (token) {
    const jwtRes = await fetch(`/api/videos/${id}/jwt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const jwtData = await jwtRes.json()
    if (jwtData.success) {
      setJwt(jwtData.data.jwt)       // Livepeer JWT
      setSrc(getSrc(playbackData.data.playbackInfo))  // set src AFTER jwt
    }
  }
}
```

**Critical: JWT must be set BEFORE src.** If src is set first, the player immediately tries to fetch the HLS stream. Livepeer sees no JWT → 401 → player enters error state. By the time the JWT arrives, the player has already failed.

---

### Step 2 — Backend Signs Livepeer JWT

**File:** `web/app/api/videos/[id]/jwt/route.ts`

```typescript
export async function GET(req, { params }) {
  const { id } = await params

  await connectDB()

  // 1. Get the video
  const video = await Video.findById(id)
  if (!video) return 404
  if (video.access === 'free') return 400  // shouldn't need JWT

  // 2. Verify the user is logged in
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
  const verifiedClaims = await privy.verifyAuthToken(authToken)

  // 3. Find user
  const user = await User.findOne({ privyId: verifiedClaims.userId })

  // 4. Creator can always watch their own content
  const isCreator = user._id.toString() === video.creator.toString()

  if (!isCreator) {
    // 5. Check subscription
    const subscription = await Subscription.findOne({
      fan: user._id,
      creator: video.creator,
      status: 'active',
      validUntil: { $gt: new Date() },  // not expired
    })

    if (!subscription) return 403  // "Subscribe to watch this video"
  }

  // 6. Sign JWT with our Livepeer private key
  // signAccessJwt internally:
  //   a. base64 decodes LIVEPEER_PRIVATE_KEY to get PEM string
  //   b. Strips PEM headers to get raw key
  //   c. Signs ECDSA SHA-256 JWT
  const jwt = await signAccessJwt({
    privateKey: process.env.LIVEPEER_PRIVATE_KEY!,  // base64 encoded PEM
    publicKey:  process.env.LIVEPEER_PUBLIC_KEY!,   // base64 encoded PEM
    issuer:     'https://beefree-nine.vercel.app',
    playbackId: video.playbackId,
    expiration: 3600,  // 1 hour duration (NOT unix timestamp)
    custom: {
      userId: user._id.toString(),
    },
  })

  return NextResponse.json({ success: true, data: { jwt } })
}
```

**What is a Livepeer JWT?**
A JSON Web Token signed with our private key. It tells Livepeer's CDN: "this user is allowed to watch playbackId X for the next 1 hour". Livepeer has our public key on file (registered when we created the signing key) and validates every request.

**Key format:** The keys in `.env.local` are base64-encoded PEM files. `signAccessJwt` handles the decoding internally — pass the raw env variable, don't decode it manually.

---

### Step 3 — Player Uses JWT

```typescript
// jwt is the Livepeer access token (not Privy JWT)
// passed directly to Player.Root
<Player.Root src={src} autoPlay volume={0} jwt={jwt ?? undefined}>
  <Player.Container>
    <Player.Video />
  </Player.Container>
</Player.Root>
```

When the player fetches HLS segments from Livepeer CDN, it automatically includes the JWT in the request header: `Livepeer-Jwt: <token>`. Livepeer CDN validates the JWT on every segment request. If valid → serve the video. If invalid/expired → 401.

---

## Player Components Breakdown

**File:** `web/app/video/[id]/page.tsx`

The player uses `@livepeer/react/player` — a headless component library. We style everything ourselves.

```typescript
// Core components
Player.Root         // provider, holds all state
Player.Container    // wrapper div with relative positioning
Player.Video        // the actual <video> element
Player.Controls     // overlay container

// Controls
Player.PlayPauseTrigger    // play/pause button
Player.PlayingIndicator    // shows different content when playing vs paused
Player.MuteTrigger         // mute/unmute button
Player.VolumeIndicator     // shows volume state
Player.Volume              // volume slider (range input)
Player.Time                // current time / duration text
Player.FullscreenTrigger   // fullscreen toggle
Player.FullscreenIndicator // shows different content in/out of fullscreen

// Seek bar (custom component using Player primitives)
Player.Seek                // seek container
Player.Track               // track background
Player.SeekBuffer          // buffered amount (lighter color)
Player.Range               // played amount (white)
Player.Thumb               // drag handle

// Quality and speed (inside Settings popover)
Player.RateSelect          // speed selector (0.5x - 2x)
Player.VideoQualitySelect  // quality selector (auto/1080p/720p/360p)
Player.LiveIndicator       // shows/hides based on live vs VOD
                           // matcher={false} = show when NOT live
```

The Settings button opens a Radix UI Popover with quality and speed selectors. The `position="popper"` and `zIndex: 99999` on SelectContent are critical — without this, the dropdown appears behind the popover or off-screen.

---

## Data Flow Diagram — Premium Video

```
Browser               Our Server (Vercel)     Livepeer CDN       MongoDB
   │                        │                      │                 │
   │── GET /api/videos/[id] ──────────────────────►│                 │
   │                        │                      │                 │
   │                        │── Video.findById() ────────────────────►│
   │                        │◄── { video doc } ─────────────────────│
   │◄── { video } ──────────│                      │                 │
   │                        │                      │                 │
   │── GET /api/playback/[playbackId] ───────────►│                 │
   │                        │── livepeer.playback.get() ──────────────►│(Livepeer API)
   │                        │◄── playbackInfo ─────────────────────────│
   │◄── { playbackInfo } ───│                      │                 │
   │                        │                      │                 │
   │  video.access === "premium"                    │                 │
   │                        │                      │                 │
   │── GET /api/videos/[id]/jwt ─────────────────►│                 │
   │   Authorization: Bearer <privy_jwt>            │                 │
   │                        │                      │                 │
   │              verify Privy JWT                  │                 │
   │              find user in MongoDB              │                 │
   │              check subscription ───────────────────────────────►│
   │                        │◄── { subscribed: true } ──────────────│
   │                        │                      │                 │
   │              signAccessJwt({ privateKey, playbackId, exp:3600 })│
   │◄── { jwt: "eyJ..." } ──│                      │                 │
   │                        │                      │                 │
   │  setJwt(jwt)           │                      │                 │
   │  setSrc(getSrc(...))   │                      │                 │
   │                        │                      │                 │
   │  <Player.Root src={src} jwt={jwt}>             │                 │
   │                        │                      │                 │
   │── HLS request ─────────────────────────────────►│               │
   │   Livepeer-Jwt: eyJ...  │                      │ validates JWT  │
   │◄── .m3u8 manifest ──────────────────────────────│               │
   │                        │                      │                 │
   │── segment requests ─────────────────────────────►│              │
   │◄── video segments ──────────────────────────────│               │
   │                        │                      │                 │
   │  Video plays ✅         │                      │                 │
```

---

## What Happens When JWT Expires

JWTs expire after 1 hour. After expiry:
1. Livepeer CDN rejects segment requests → 401
2. Player shows error state
3. User needs to reload the page
4. Page fetches fresh JWT from our server
5. Playback resumes

For now this is acceptable. In the future, we can implement token refresh before expiry.

---

## Common Errors

### "Unauthorized to view video" in browser console
Livepeer rejected the JWT. Possible causes:
1. JWT was set after src — player already failed. Fixed by always setting JWT before src.
2. `expiration` was a unix timestamp instead of duration. Must be `3600` not `Math.floor(Date.now()/1000) + 3600`.
3. Keys not decoded correctly. Pass `LIVEPEER_PRIVATE_KEY` directly to `signAccessJwt` — it decodes internally.

### "Subscribe to watch this video" (403)
User is not subscribed. Check MongoDB → subscriptions collection for an active subscription between this fan and creator.

### Video stays on loading spinner
`playbackId` is wrong, or Livepeer asset status is not "ready". Check the video document in MongoDB.

### Speed/quality dropdowns appear behind the popover
Missing `zIndex: 99999` on `Player.SelectContent`, or missing `position="popper"` prop. Both are needed.