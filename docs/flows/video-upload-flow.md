# Video Upload Flow

How a creator uploads a video.

---

## Overview

Video files never pass through our server. The browser uploads directly to Livepeer. Our server only handles metadata.

---

## Step-by-Step

### Step 1 — Create Livepeer Asset (Backend)

**File:** `web/app/api/videos/route.ts`

```typescript
const response = await livepeer.asset.create({
  name: title,
  playbackPolicy:
    access === 'premium'
      ? { type: Type.Jwt }
      : { type: Type.Public },
})

const asset = response.data?.asset
const tusEndpoint = response.data?.tusEndpoint

// Save to MongoDB
await Video.create({
  title, description, playbackId: asset.playbackId,
  assetId: asset.id, creator: user._id,
  access, status: 'uploading', tags,
})
```

### Step 2 — TUS Upload (Browser → Livepeer directly)

**File:** `web/app/dashboard/upload/page.tsx`

```typescript
const upload = new tus.Upload(file, {
  endpoint: tusEndpoint,
  retryDelays: [0, 3000, 5000, 10000],
  metadata: { filename: file.name, filetype: file.type },
  onProgress: (uploaded, total) => {
    setProgress(Math.round((uploaded / total) * 100))
  },
  onSuccess: () => setStatus('done'),
})
upload.start()
```

### Step 3 — Livepeer Webhook Updates MongoDB

**File:** `web/app/api/webhooks/livepeer/route.ts`

```typescript
case 'asset.ready': {
  const assetId  = payload?.asset?.id
  const duration = payload?.asset?.snapshot?.videoSpec?.duration || 0

  // thumbnailUrl is derived from playbackId
  const playbackId = payload?.asset?.playbackId
  const thumbnailUrl = playbackId
    ? `https://storage.lp-playback.studio/hls/${playbackId}/thumbnails/keyframes_0.png`
    : ''

  await Video.findOneAndUpdate(
    { assetId },
    { status: 'ready', duration: Math.round(duration), thumbnailUrl }
  )
  break
}

case 'asset.failed':
  await Video.findOneAndUpdate({ assetId }, { status: 'failed' })
  break
```

**thumbnailUrl** is automatically set when the asset is ready. It's used in the feed, explore, and video pages as the thumbnail image. If the thumbnail URL returns 404 in the player, `onError` hides the image gracefully.

---

## View Count

**File:** `web/app/api/videos/[id]/route.ts`

Every GET request to a video increments `viewCount`:

```typescript
await Video.findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
```

This runs on every page load of `/video/[id]`.

---

## Common Errors

### Video stays "uploading" forever (local dev)
Expected. Livepeer webhooks can't reach localhost. Manually update status in MongoDB Compass.

### thumbnailUrl shows broken image
Thumbnail takes a few minutes to generate after `asset.ready`. The player uses `onError` to hide broken images.

### "Only creators can upload videos" (403)
User role is `"fan"`. They need to apply via `/apply` and get approved by admin.
