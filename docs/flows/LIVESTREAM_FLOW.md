# Livestream Flow

How a creator goes live and how fans watch — covering both browser streaming (WebRTC) and OBS streaming (RTMP).

---

## Overview

Livestreaming involves two separate flows:

1. **Broadcasting** — creator sends video to Livepeer (browser WebRTC or OBS RTMP)
2. **Viewing** — fans receive video from Livepeer CDN

Our server handles setup (creating the stream) and access control (is this stream premium?). The actual video data flows directly between the creator → Livepeer → viewers. Our server is not in the video path.

---

## Systems Involved

```
Creator Browser      Our Server         Livepeer          MongoDB
    │                    │                  │                 │
    ▼                    ▼                  ▼                 ▼
dashboard/stream     streams/route.ts   stream.create()  Stream model
Broadcast.Root       webhooks/livepeer  RTMP ingest
WebRTC (WHIP)                           WebRTC (WHIP)
                                        CDN delivery

Viewer Browser
    │
    ▼
stream/[playbackId]/page.tsx
Player.Root (lowLatency)
```

---

## Broadcasting — Step by Step

### Step 1 — Creator Opens Go Live Page

**File:** `web/app/dashboard/stream/page.tsx`

The page has two phases:
- Phase 1 (`status === 'idle'`): fill in title, access type, streaming method
- Phase 2 (`status === 'ready'`): show stream details + broadcast interface

```typescript
const [status, setStatus] = useState<StreamStatus>('idle')
const [stream, setStream] = useState<StreamData | null>(null)
const [title, setTitle]   = useState('')
const [access, setAccess] = useState<'free' | 'premium'>('free')
const [useBrowser, setUseBrowser] = useState(true)
```

Camera cleanup on unmount (so camera indicator light turns off when navigating away):
```typescript
useEffect(() => {
  return () => {
    // Stop all camera/mic tracks when leaving the page
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => stream.getTracks().forEach(track => track.stop()))
      .catch(() => {})

    // Also stop any video elements still holding tracks
    document.querySelectorAll('video').forEach(video => {
      const stream = video.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        video.srcObject = null
      }
    })
  }
}, [])
```

---

### Step 2 — Creator Clicks "Create Stream"

```typescript
const handleCreateStream = async () => {
  const token = await getAccessToken()

  const res = await fetch('/api/streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, access }),
  })

  const data = await res.json()
  setStream(data.data)  // { streamId, streamKey, playbackId, rtmpIngestUrl, whipUrl }
  setStatus('ready')
}
```

---

### Step 3 — Our Backend Creates Livepeer Stream

**File:** `web/app/api/streams/route.ts` → `POST` handler

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify auth — must be a creator
  const verifiedClaims = await privy.verifyAuthToken(authToken)
  const user = await User.findOne({ privyId: verifiedClaims.userId })
  if (user.role !== 'creator') return 403

  const { title, access } = await req.json()

  // 2. Create stream on Livepeer
  // record: true means Livepeer saves the stream for replay after it ends
  const response = await livepeer.stream.create({
    name: title,
    record: true,
  })

  const s = response.stream
  // s.id        = Livepeer's internal stream ID
  // s.streamKey = secret key for RTMP authentication
  // s.playbackId = public ID for viewers

  // 3. Save to MongoDB
  const stream = await Stream.create({
    title,
    streamId:   s.id,
    streamKey:  s.streamKey,
    playbackId: s.playbackId,
    creator:    user._id,
    access:     access || 'free',
    status:     'idle',  // will become 'live' via webhook when stream starts
  })

  // 4. Return everything the frontend needs
  return NextResponse.json({
    success: true,
    data: {
      streamId:    s.id,
      streamKey:   s.streamKey,
      playbackId:  s.playbackId,
      rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${s.streamKey}`,  // for OBS
      whipUrl: `https://livepeer.studio/webrtc/${s.streamKey}`,        // for browser
      mongoId: stream._id,
    }
  })
}
```

---

### Step 4A — Browser Streaming (WebRTC/WHIP)

**File:** `web/app/dashboard/stream/page.tsx`

```typescript
// Broadcast.Root takes the WHIP endpoint URL
// WHIP = WebRTC HTTP Ingest Protocol
// Browser camera/mic → WebRTC → Livepeer
<Broadcast.Root ingestUrl={stream.whipUrl}>
  <Broadcast.Container>
    <Broadcast.Video />  {/* shows camera preview */}

    <Broadcast.Controls>
      {/* Go Live / Stop button */}
      <Broadcast.EnabledTrigger>
        <Broadcast.EnabledIndicator asChild matcher={false}>
          <span>🔴 Go Live</span>   {/* shown when NOT live */}
        </Broadcast.EnabledIndicator>
        <Broadcast.EnabledIndicator asChild>
          <span>⏹ Stop</span>       {/* shown when live */}
        </Broadcast.EnabledIndicator>
      </Broadcast.EnabledTrigger>

      {/* Camera toggle */}
      <Broadcast.VideoEnabledTrigger>
        <Broadcast.VideoEnabledIndicator asChild matcher={false}>
          <span>📷</span>  {/* camera on */}
        </Broadcast.VideoEnabledIndicator>
        <Broadcast.VideoEnabledIndicator asChild>
          <span>🚫</span>  {/* camera off */}
        </Broadcast.VideoEnabledIndicator>
      </Broadcast.VideoEnabledTrigger>

      {/* Mic toggle */}
      <Broadcast.AudioEnabledTrigger>...</Broadcast.AudioEnabledTrigger>

      {/* LIVE indicator — only shows when stream is active */}
      <Broadcast.StatusIndicator matcher="live">
        <div style={{ background: '#ef4444', borderRadius: '50%' }} />
        <span>LIVE</span>
      </Broadcast.StatusIndicator>
    </Broadcast.Controls>
  </Broadcast.Container>
</Broadcast.Root>
```

When creator clicks "Go Live":
1. Browser requests camera/mic permission
2. Browser establishes WebRTC connection to `https://livepeer.studio/webrtc/[streamKey]`
3. Video/audio streams to Livepeer in real time
4. Livepeer transcodes and distributes to CDN
5. Latency: ~0.5-1 second (WebRTC is very low latency)

---

### Step 4B — OBS Streaming (RTMP)

The creator sets up OBS with:
- **Server:** `rtmp://rtmp.livepeer.com/live`
- **Stream Key:** the `streamKey` from the UI

OBS → RTMP → Livepeer Ingest → Livepeer CDN

RTMP latency is 5-10 seconds (not real-time like WebRTC). This is a protocol limitation. OBS streams are also sometimes rejected by Livepeer WebRTC (which causes the `bframes` warning in the viewer page) — this is expected and the player falls back to HLS automatically.

---

### Step 5 — Livepeer Webhook Updates Stream Status

**File:** `web/app/api/webhooks/livepeer/route.ts`

```typescript
case 'stream.started': {
  // Creator clicked Go Live / OBS started sending data
  const streamId = payload?.id
  await Stream.findOneAndUpdate({ streamId }, { status: 'live' })
  break
}

case 'stream.idle': {
  // Creator stopped streaming / connection dropped
  const streamId = payload?.id
  await Stream.findOneAndUpdate({ streamId }, { status: 'ended' })
  break
}
```

---

## Viewing — Step by Step

### Step 1 — Viewer Opens Stream URL

**File:** `web/app/stream/[playbackId]/page.tsx`

The URL looks like: `https://beefree-nine.vercel.app/stream/cec9uwrfrydm9fwy`

```typescript
const [src, setSrc]           = useState(null)
const [isLocked, setIsLocked] = useState(false)
const [creatorId, setCreatorId] = useState(null)
```

---

### Step 2 — Check Stream Access

```typescript
useEffect(() => {
  if (!playbackId) return

  // 1. Get stream metadata from our DB
  // Need to know: is this stream premium? Who is the creator?
  fetch(`/api/streams?playbackId=${playbackId}`)
    .then(r => r.json())
    .then(async (streamData) => {
      const stream = streamData.data?.stream

      if (stream?.access === 'premium') {
        setCreatorId(stream.creator?._id || stream.creator)
        setCreatorName(stream.creator?.name || 'this creator')
        setPrice(stream.creator?.subscriptionPrice || 9900)

        // Not logged in → show lock immediately
        if (!user) {
          setIsLocked(true)
          return
        }

        // Check subscription
        const subRes = await fetch(
          `/api/subscriptions?creatorId=${stream.creator?._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const subData = await subRes.json()
        const subscribed = subData.data?.subscribed || false

        // Check if viewer IS the creator
        const isCreator = user._id.toString() === stream.creator?._id?.toString()

        if (!subscribed && !isCreator) {
          setIsLocked(true)  // show lock screen
          return
        }

        setIsLocked(false)  // allow through
      }

      // Load playback src (for free streams, or subscribed premium)
      const playbackRes = await fetch(`/api/playback/${playbackId}`)
      const playbackData = await playbackRes.json()
      if (playbackData.success) {
        setSrc(getSrc(playbackData.data.playbackInfo))
      }
    })
    .catch(() => {
      // If stream API fails, try loading directly (handles free streams)
      fetch(`/api/playback/${playbackId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setSrc(getSrc(data.data.playbackInfo))
        })
    })
}, [playbackId, user])
```

---

### Step 3 — UI Renders Based on State

```typescript
{loading ? (
  <LoadingSpinner />

) : isLocked ? (
  // Premium stream — not subscribed
  <LockScreen
    price={price}
    onSubscribe={handleSubscribe}
  />

) : error || !src ? (
  // Stream offline or error
  <p>Stream is offline</p>

) : (
  // Stream is accessible — show player
  <Player.Root src={src} autoPlay lowLatency>
    <Player.Container>
      <Player.Video />
      {/* mute, live indicator, fullscreen */}
    </Player.Container>
  </Player.Root>
)}
```

**`lowLatency={true}`** tells the player to attempt WebRTC playback first (lowest latency). If WebRTC fails (OBS stream with B-frames, slow network), falls back to HLS automatically. The `bframes` warning in console is not an error — it's just Livepeer saying "switching to HLS because WebRTC can't handle B-frames".

---

## How GET /api/streams Works

**File:** `web/app/api/streams/route.ts` → `GET` handler

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const playbackId = searchParams.get('playbackId')

  await connectDB()

  // Find stream + populate creator (to get name, subscriptionPrice)
  const stream = await Stream.findOne({ playbackId })
    .populate('creator', 'name avatar subscriptionPrice')
    .lean()

  return NextResponse.json({ success: true, data: { stream } })
}
```

The `.populate('creator', 'name avatar subscriptionPrice')` joins the User document into the stream result. This is why `stream.creator` is an object `{ _id, name, avatar, subscriptionPrice }` instead of just an ObjectId.

---

## Data Flow Diagram

```
Creator Browser              Livepeer                     Viewer Browser
    │                            │                              │
    │── POST /api/streams ──────►│(Our Server)                  │
    │   creates stream in Livepeer and MongoDB                   │
    │◄── { streamKey, playbackId, whipUrl }                      │
    │                            │                              │
    │── WebRTC (WHIP) ────────────►│                             │
    │   browser cam/mic data     │ Livepeer ingest              │
    │                            │ transcodes in real time      │
    │                            │ distributes to CDN           │
    │                            │                              │
    │                            │◄── webhook: stream.started   │
    │                            │(Our Server)                  │
    │                            │ Stream.update(status:"live") │
    │                            │                              │
    │                            │              GET /api/streams?playbackId=xxx
    │                            │              (Our Server)    │
    │                            │              check access/subscription
    │                            │              return stream metadata
    │                            │                              │
    │                            │              GET /api/playback/xxx
    │                            │              (Our Server → Livepeer API)
    │                            │              return HLS URLs │
    │                            │                              │
    │                            │◄─── HLS/WebRTC stream ───────│
    │                            │     (CDN → viewer directly)  │
    │                            │                              │
    │── stop streaming ───────────►│                             │
    │                            │◄── webhook: stream.idle      │
    │                            │(Our Server)                  │
    │                            │ Stream.update(status:"ended")│
```

---

## Important: Premium Streams Are UI-Locked Only

For videos, Livepeer enforces the JWT at the CDN level — no JWT = 401 = can't watch.

For streams, we don't set `playbackPolicy: { type: "jwt" }` when creating the stream. This means Livepeer CDN serves to anyone who has the playbackId URL. Our lock is only at the UI level.

**What this means in practice:**
- If someone shares the full stream URL (e.g. `beefree.app/stream/abc123`), non-subscribers still see the lock screen ✅
- If someone shares just the playbackId and accesses Livepeer directly, they could watch ⚠️
- The playbackId is not displayed in the UI, so it's not easy to extract

For MVP this is acceptable. For production hardening, add `playbackPolicy: { type: "jwt" }` to stream creation and implement stream JWT signing similar to video JWT.

---

## Common Errors

### "Stream is offline" when stream is live
The stream status in MongoDB might still be "idle" (webhook hasn't fired yet). Wait a few seconds and refresh. Or in local dev, manually update status in MongoDB Compass.

### Camera indicator stays on after leaving stream page
The `useEffect` cleanup should handle this. If it persists, the cleanup ran before the camera was fully initialized. A page refresh clears it completely.

### "bframes" warning in browser console
Not an error. OBS streams encode B-frames which WebRTC can't handle. Player automatically falls back to HLS. Stream plays normally with ~5-10 second latency instead of sub-second.

### Premium stream shows lock screen even for subscribed user
Check that `user._id.toString() === stream.creator?._id?.toString()` — ObjectId comparison was the original bug. The fix converts both to strings before comparing. If this still fails, check MongoDB to confirm the subscription document exists with `status: "active"` and `validUntil` in the future.