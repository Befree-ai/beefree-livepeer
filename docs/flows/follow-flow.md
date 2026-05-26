# Follow Flow

How fans follow and unfollow creators.

---

## Overview

Fans can follow creators. Following affects:
- Feed personalisation (followed creators appear first)
- followersCount on creator profile
- followingCount on fan profile

---

## Data Model

Stored on the User document:
```typescript
following: string[]    // array of creator _id strings
followersCount: number
followingCount: number
```

---

## API Routes

**File:** `web/app/api/follow/[creatorId]/route.ts`

### GET — Check follow status
```typescript
const user = await User.findOne({ privyId })
const isFollowing = user.following.includes(creatorId)
return { isFollowing }
```

### POST — Follow
```typescript
// Add creatorId to fan's following array
await User.findByIdAndUpdate(fan._id, {
  $addToSet: { following: creatorId },
  $inc: { followingCount: 1 },
})

// Increment creator's follower count
await User.findByIdAndUpdate(creatorId, {
  $inc: { followersCount: 1 },
})
```

### DELETE — Unfollow
```typescript
await User.findByIdAndUpdate(fan._id, {
  $pull: { following: creatorId },
  $inc: { followingCount: -1 },
})

await User.findByIdAndUpdate(creatorId, {
  $inc: { followersCount: -1 },
})
```

---

## UI Implementation

**File:** `web/app/creator/[id]/page.tsx`

```typescript
// Check follow status on page load
useEffect(() => {
  fetch(`/api/follow/${id}`, { headers: { Authorization } })
    .then(r => r.json())
    .then(data => setIsFollowing(data.data.isFollowing))
}, [user, id])

// Optimistic update on follow/unfollow
const handleFollow = async () => {
  const method = isFollowing ? 'DELETE' : 'POST'
  const res = await fetch(`/api/follow/${id}`, { method, headers: { Authorization } })
  const data = await res.json()
  if (data.success) {
    setIsFollowing(data.data.isFollowing)
    // Update follower count locally without re-fetching
    setCreator(prev => ({
      ...prev,
      followersCount: prev.followersCount + (isFollowing ? -1 : 1)
    }))
  }
}
```

---

## Follower Count Display

**File:** `web/app/creator/[id]/page.tsx`

Large numbers are formatted using `formatCount()`:

```typescript
function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toString()
}

// Examples:
// 15600000 → "15.6M"
// 847000   → "847K"
// 543      → "543"
```

To set a demo follower count for pitch purposes, update `followersCount` directly in MongoDB Atlas.

---

## Feed Personalisation

**File:** `web/app/api/feed/route.ts`

The feed prioritises content from followed creators:

```typescript
// Get user's following list
const user = await User.findOne({ privyId })
const followingIds = user?.following || []

// Sort: followed creators first, then everyone else
const videos = await Video.find({ status: 'ready' })
  .sort({ createdAt: -1 })
  .populate('creator')

// Followed creators' videos come first
const sorted = [
  ...videos.filter(v => followingIds.includes(v.creator._id.toString())),
  ...videos.filter(v => !followingIds.includes(v.creator._id.toString())),
]
```
