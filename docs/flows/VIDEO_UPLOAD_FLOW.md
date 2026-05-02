# Video Upload Flow

How a creator uploads a video — from clicking "Upload" to the video being ready to watch.

---

## Overview

The most important thing to understand about this flow: **the video file never passes through our server**. The browser uploads directly to Livepeer's servers. Our server only handles the metadata (title, access type, etc.) and tells Livepeer to prepare for the upload.

This means:
- Our Vercel server doesn't get overwhelmed by large video files
- Upload speed is limited only by the user's internet → Livepeer (not by Vercel)
- We don't pay for video bandwidth on Vercel

---

## Systems Involved

```
Browser           Our Server         Livepeer          MongoDB
  │                   │                  │                 │
  ▼                   ▼                  ▼                 ▼
upload/page.tsx   videos/route.ts   asset.create()    Video model
tus-js-client     (POST only)       TUS endpoint      videos collection
                                    Transcoding
                                    Webhooks
```

---

## Step-by-Step Flow

### Step 1 — Creator Opens Upload Page

**File:** `web/app/dashboard/upload/page.tsx`

The page has these state variables:
```typescript
const [title, setTitle]         = useState('')
const [description, setDescription] = useState('')
const [access, setAccess]       = useState<'free' | 'premium'>('free')
const [tags, setTags]           = useState('')
const [file, setFile]           = useState<File | null>(null)
const [status, setStatus]       = useState<UploadStatus>('idle')
const [progress, setProgress]   = useState(0)
```

Upload status transitions: `idle → creating → uploading → done/error`

The file picker uses a hidden `<input type="file">` triggered by clicking a styled div:
```typescript
<div onClick={() => fileInputRef.current?.click()}>
  {/* styled drop zone */}
</div>
<input
  ref={fileInputRef}
  type="file"
  accept="video/*"
  className="hidden"
  onChange={(e) => setFile(e.target.files?.[0] || null)}
/>
```

---

### Step 2 — Creator Clicks "Upload video"

**File:** `web/app/dashboard/upload/page.tsx` → `handleUpload()`

```typescript
const handleUpload = async () => {
  if (!file || !title) return
  setStatus('creating')

  // Get Privy JWT token for auth
  const token = await getAccessToken()

  // Step A: Tell our backend to create a Livepeer asset
  const res = await fetch('/api/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      description,
      access,     // "free" or "premium"
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    }),
  })

  const data = await res.json()
  // data.data = { video: { _id, playbackId, ... }, tusEndpoint: "https://..." }

  const { tusEndpoint, video } = data.data
  setPlaybackId(video.playbackId)
  setVideoId(video._id)
  setStatus('uploading')

  // Step B: Upload file directly to Livepeer via TUS
  // ... (see Step 4)
}
```

---

### Step 3 — Our Backend Creates Livepeer Asset

**File:** `web/app/api/videos/route.ts` → `POST` handler

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify auth token
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
  const verifiedClaims = await privy.verifyAuthToken(authToken)

  // 2. Get user from DB — must be a creator
  await connectDB()
  const user = await User.findOne({ privyId: verifiedClaims.userId })
  if (user.role !== 'creator') return 403

  // 3. Parse request body
  const { title, description, access, tags } = await req.json()

  // 4. Create asset on Livepeer
  // This tells Livepeer: "a video is about to be uploaded"
  // Livepeer returns a TUS endpoint URL to upload the actual file to
  const response = await livepeer.asset.create({
    name: title,
    playbackPolicy:
      access === 'premium'
        ? { type: Type.Jwt }      // requires JWT to watch
        : { type: Type.Public },  // anyone can watch
  })

  const asset = response.data?.asset
  const tusEndpoint = response.data?.tusEndpoint
  // asset.id = Livepeer's internal asset ID
  // asset.playbackId = public ID for watching
  // tusEndpoint = URL to upload the video file to

  // 5. Save video metadata to MongoDB
  // Status is "uploading" — will become "ready" after Livepeer processes it
  const video = await Video.create({
    title,
    description: description || '',
    playbackId: asset.playbackId,
    assetId: asset.id,
    creator: user._id,
    access: access || 'free',
    status: 'uploading',    // will change to "ready" via webhook
    tags: tags || [],
  })

  // 6. Return both the video doc and the TUS endpoint
  return NextResponse.json({
    success: true,
    data: {
      video: video.toObject(),
      tusEndpoint,  // browser will upload file here directly
    }
  })
}
```

**What is Type.Jwt vs Type.Public?**
- `Type.Public` — Livepeer CDN serves to anyone with the playbackId
- `Type.Jwt` — Livepeer CDN requires a valid signed JWT before serving

This is set at creation time and cannot be changed later without recreating the asset.

---

### Step 4 — Browser Uploads File Directly to Livepeer

**File:** `web/app/dashboard/upload/page.tsx` → `handleUpload()` continued

```typescript
// TUS (Tus Upload Protocol) — resumable file uploads
// If connection drops, upload resumes from where it left off
const upload = new tus.Upload(file, {
  endpoint: tusEndpoint,      // Livepeer's TUS endpoint from Step 3
  retryDelays: [0, 3000, 5000, 10000],  // retry on failure
  metadata: {
    filename: file.name,
    filetype: file.type,
  },
  onProgress: (uploaded: number, total: number) => {
    // Update progress bar
    setProgress(Math.round((uploaded / total) * 100))
  },
  onSuccess: () => {
    // File fully uploaded to Livepeer
    // Livepeer now starts transcoding (1080p, 720p, 360p)
    setStatus('done')
    setProgress(100)
  },
  onError: (err: Error) => {
    setError('Upload failed: ' + err.message)
    setStatus('error')
  },
})

uploadRef.current = upload  // save ref so we can cancel later
upload.start()
```

**What is TUS?**
TUS is a protocol for resumable uploads. If the user's internet drops mid-upload, TUS can resume from the exact byte it stopped at. This is critical for large video files. Livepeer natively supports TUS.

**Why not just use `fetch` or `XMLHttpRequest` for upload?**
Regular HTTP uploads fail completely if connection drops. You'd have to restart the entire upload. With TUS, a 2GB video with a brief network dropout can resume from 1.8GB instead of restarting.

---

### Step 5 — Livepeer Transcodes the Video

After the browser finishes uploading the file to Livepeer, Livepeer:
1. Receives the raw video file
2. Transcodes it to multiple resolutions: 1080p, 720p, 360p, 240p
3. Packages it as HLS (HTTP Live Streaming format)
4. Stores it on their CDN
5. Sends a webhook event to our server: `asset.ready`

This transcoding takes 1-5 minutes depending on video length.

**Why multiple resolutions?**
HLS adaptive bitrate — if a viewer has slow internet, the player automatically switches to 360p. Fast internet → 1080p. This is how Netflix/YouTube work.

---

### Step 6 — Livepeer Webhook Updates MongoDB

**File:** `web/app/api/webhooks/livepeer/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json()
  const event = body.event
  const payload = body.payload

  await connectDB()

  switch (event) {
    case 'asset.ready': {
      // Video is transcoded and ready to watch
      const assetId  = payload?.asset?.id
      const duration = payload?.asset?.snapshot?.videoSpec?.duration || 0

      await Video.findOneAndUpdate(
        { assetId },
        {
          status: 'ready',
          duration: Math.round(duration)  // store seconds
        }
      )
      break
    }

    case 'asset.failed': {
      // Transcoding failed (corrupted file, unsupported format, etc.)
      const assetId = payload?.asset?.id

      await Video.findOneAndUpdate(
        { assetId },
        { status: 'failed' }
      )
      break
    }
  }

  // Always return 200 to Livepeer
  // If we return an error, Livepeer will retry the webhook
  return NextResponse.json({ received: true })
}
```

**Why always return 200?**
If our webhook handler returns a non-200 status, Livepeer treats it as a failure and retries. We handle our own errors internally and always confirm receipt to Livepeer.

**Local development problem:**
Livepeer's webhook server can't reach `localhost:3000`. So in development, the webhook never fires and video status stays "uploading". The workaround is to manually update status in MongoDB Compass:
```
Find video → Edit → status: "uploading" → change to → status: "ready"
```

In production (Vercel), the webhook works automatically. Configure it in Livepeer Studio → Developers → Webhooks → add `https://beefree-nine.vercel.app/api/webhooks/livepeer`.

---

## Complete Data Flow Diagram

```
Browser                  Our Server (Vercel)       Livepeer           MongoDB
   │                            │                      │                  │
   │── POST /api/videos ───────►│                      │                  │
   │   { title, access, tags }  │                      │                  │
   │                            │                      │                  │
   │                   verify Privy JWT                │                  │
   │                   check user.role === "creator"   │                  │
   │                            │                      │                  │
   │                            │── asset.create() ───►│                  │
   │                            │   { name, playbackPolicy }              │
   │                            │◄── { asset, tusEndpoint } ─────────────│
   │                            │                      │                  │
   │                            │── Video.create() ──────────────────────►│
   │                            │   status: "uploading"                   │
   │                            │◄── video doc ──────────────────────────│
   │                            │                      │                  │
   │◄── { video, tusEndpoint } ─│                      │                  │
   │                            │                      │                  │
   │                                                   │                  │
   │  (Our server is completely out of the upload path from here)         │
   │                                                   │                  │
   │── TUS upload (file chunks) ───────────────────────►│                 │
   │◄── progress callbacks ─────────────────────────────│                 │
   │── TUS complete ────────────────────────────────────►│                │
   │                                                   │                  │
   │                                   Livepeer transcodes:               │
   │                                   1080p / 720p / 360p / 240p         │
   │                                   HLS packaging                      │
   │                                   CDN upload                         │
   │                                                   │                  │
   │                            │◄── webhook ──────────│                  │
   │                            │    event: "asset.ready"                 │
   │                            │    { assetId, duration }                │
   │                            │                      │                  │
   │                            │── Video.update() ──────────────────────►│
   │                            │   status: "ready"                       │
   │                            │   duration: 127                         │
   │                            │◄── updated doc ────────────────────────│
   │                            │                      │                  │
   │                            │── return 200 ────────►│                 │
```

---

## Cancel Upload

```typescript
// User can cancel mid-upload
const handleCancel = () => {
  uploadRef.current?.abort()  // TUS abort pauses the upload
  setStatus('idle')
  setProgress(0)
}
```

TUS abort is not a delete — the partial upload remains on Livepeer's side. The video document stays in MongoDB with `status: "uploading"`. This is fine — incomplete uploads are just never shown to viewers.

---

## Common Errors

### "Only creators can upload videos" (403)
The user's role is `"fan"`. Go to MongoDB Atlas → users collection → find the user → change `role` to `"creator"`.

### "Livepeer asset creation failed"
`LIVEPEER_API_KEY` is missing or invalid in `.env.local`. Check the key in Livepeer Studio dashboard.

### Video stays "uploading" forever (local dev)
Expected. Livepeer webhooks can't reach localhost. Manually update status in MongoDB Compass.

### Upload fails at 50% with network error
TUS handles this automatically — it retries with backoff (0ms, 3s, 5s, 10s). If all retries fail, the error is shown to the user and they can try again. The upload resumes from the last successful byte, not the beginning.

### "Failed to create video" (500)
Check the browser network tab for the actual error from `/api/videos`. Most likely MongoDB is not connected (M0 cluster paused).