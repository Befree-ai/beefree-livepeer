# Avatar Upload Flow

How creators upload their profile photo via Cloudinary.

---

## Overview

Avatar images are stored on Cloudinary. The flow:
1. Creator selects image in Edit Profile page
2. Browser sends image to our API route
3. Our server uploads to Cloudinary
4. Cloudinary URL saved to MongoDB user document

---

## Systems Involved
Browser              Our Server          Cloudinary         MongoDB
│                      │                   │                 │
▼                      ▼                   ▼                 ▼
dashboard/profile/   api/upload/        beefree/avatars    User.avatar
page.tsx             route.ts           folder             field

---

## API Route

**File:** `web/app/api/upload/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify auth
  const verifiedClaims = await privy.verifyAuthToken(authToken)

  // 2. Get image from FormData
  const formData = await req.formData()
  const file = formData.get('file') as File

  // 3. Validate
  if (!file.type.startsWith('image/')) return 400
  if (file.size > 5 * 1024 * 1024) return 400  // 5MB max

  // 4. Convert to base64 and upload to Cloudinary
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  const uploadResult = await cloudinary.uploader.upload(base64, {
    folder: 'beefree/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })

  const imageUrl = uploadResult.secure_url

  // 5. Save to MongoDB
  await User.findOneAndUpdate(
    { privyId },
    { avatar: imageUrl },
  )

  return { success: true, data: { url: imageUrl } }
}
```

**Cloudinary transformations applied:**
- `crop: 'fill'` — crops to square
- `gravity: 'face'` — centers crop on detected face
- `quality: 'auto'` — automatic quality optimization
- `fetch_format: 'auto'` — serves WebP to browsers that support it

---

## UI Implementation

**File:** `web/app/dashboard/profile/page.tsx`

```typescript
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Show preview immediately (before upload completes)
  const reader = new FileReader()
  reader.onload = ev => setAvatarPreview(ev.target?.result as string)
  reader.readAsDataURL(file)

  // Upload to Cloudinary via our API
  setUploadingAvatar(true)
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json()
  if (data.success) {
    await syncUser()  // refresh user context with new avatar URL
  }
}
```

The avatar preview shows immediately (using FileReader) while the upload happens in the background. If upload fails, the preview reverts to the previous avatar.

---

## Where Avatar Appears

Once uploaded, the Cloudinary URL is stored in `user.avatar` and appears:
- Creator profile hero section (large square)
- Explore page creator cards
- Feed video cards
- Navbar (small circle)
- Dashboard sidebar (initial letter fallback if no avatar)

---

## Environment Variables Required
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

---

## Common Errors

### Upload fails silently
Check that all three Cloudinary env vars are set in Vercel. The API route will return 500 if Cloudinary is not configured.

### Image appears distorted
The `crop: 'fill'` transformation forces a 400×400 square crop. If the face detection (`gravity: 'face'`) can't find a face, it crops from the center.

### Old avatar still showing after upload
`syncUser()` was not called after upload, or browser has cached the old Cloudinary URL. Hard refresh clears it.
