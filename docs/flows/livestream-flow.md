# Livestream Flow

How a creator goes live and how fans watch.

---

## Overview

Two separate flows:
1. **Broadcasting** — creator sends video to Livepeer (browser WebRTC or OBS RTMP)
2. **Viewing** — fans receive video from Livepeer CDN

Our server handles setup and access control only. Video data flows directly: creator → Livepeer → viewers.

---

## Systems Involved
Creator Browser      Our Server         Livepeer          MongoDB
│                    │                  │                 │
▼                    ▼                  ▼                 ▼
dashboard/stream     streams/route.ts   stream.create()  Stream model
Broadcast.Root       webhooks/livepeer  RTMP / WHIP

---

## Broadcasting Flow

### Step 1 — Create Stream (Backend)

**File:** `web/app/api/streams/route.ts`

```typescript
const response = await livepeer.stream.create({
  name: title,
  record: true,
})

const s = response.stream

// Return WHIP URL for browser, RTMP for OBS
return {
  streamId:     s.id,
  streamKey:    s.streamKey,
  playbackId:   s.playbackId,
  rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${s.streamKey}`,
  whipUrl:      `https://playback.livepeer.studio/webrtc/${s.streamKey}`,
}
```

**Critical:** WHIP URL must use `playback.livepeer.studio` (not `livepeer.studio`). The older domain no longer works for WHIP ingest.

### Step 2 — Browser Streaming (WebRTC/WHIP)

**File:** `web/app/dashboard/stream/page.tsx`

```typescript
<Broadcast.Root ingestUrl={stream.whipUrl}>
  <Broadcast.Container>
    <Broadcast.Video />
    <Broadcast.Controls>
      <Broadcast.EnabledTrigger>
        <Broadcast.EnabledIndicator asChild matcher={false}>
          <span>🔴 Go Live</span>
        </Broadcast.EnabledIndicator>
        <Broadcast.EnabledIndicator asChild>
          <span>⏹ Stop</span>
        </Broadcast.EnabledIndicator>
      </Broadcast.EnabledTrigger>
      <Broadcast.StatusIndicator matcher="live">
        <div style={{ background: '#ef4444' }} />
        <span>LIVE</span>
      </Broadcast.StatusIndicator>
    </Broadcast.Controls>
  </Broadcast.Container>
</Broadcast.Root>
```

**Browser compatibility:**
- ✅ Brave — works perfectly (no B-frames)
- ✅ Firefox — works
- ❌ Chrome — sends B-frames, Livepeer WebRTC rejects. Stream shows Idle. Use Brave or OBS.

### Step 3 — OBS Streaming (RTMP)

Creator sets up OBS:
- Server: `rtmp://rtmp.livepeer.com/live`
- Stream Key: shown in BeeFree dashboard

OBS → RTMP → Livepeer. Works on all browsers. Recommended for professional streaming.

---

## Viewing Flow

**File:** `web/app/stream/[playbackId]/page.tsx`

```typescript
// 1. Get stream metadata (access type, creator)
fetch(`/api/streams?playbackId=${playbackId}`)

// 2. If premium → check subscription
fetch(`/api/subscriptions?creatorId=${stream.creator._id}`)

// 3. Load playback src
fetch(`/api/playback/${playbackId}`)
setSrc(getSrc(playbackData.data.playbackInfo))

// 4. Render player
<Player.Root src={src} autoPlay lowLatency={false}>
```

**`lowLatency={false}`** forces HLS playback on the viewer side. This avoids the B-frames issue where the viewer also gets WebRTC which can't handle OBS streams.

---

## Webhook Updates Stream Status

**File:** `web/app/api/webhooks/livepeer/route.ts`

```typescript
case 'stream.started':
  await Stream.findOneAndUpdate({ streamId }, { status: 'live' })

case 'stream.idle':
  await Stream.findOneAndUpdate({ streamId }, { status: 'ended' })
```

---

## Common Errors

### Stream shows Idle in Livepeer dashboard
Using Chrome for browser streaming. Chrome encodes B-frames which Livepeer WHIP rejects. Switch to Brave or OBS.

### Viewer sees "Stream is offline"
Stream not yet active. Wait 15-20 seconds after going live for Livepeer to start serving HLS.

### "bframes" warning in console
OBS streams with B-frames. Player automatically falls back to HLS. Stream plays with ~5-10s latency. Not an error.

### Camera light stays on after leaving page
`useEffect` cleanup handles this. If persistent, refresh the page.
