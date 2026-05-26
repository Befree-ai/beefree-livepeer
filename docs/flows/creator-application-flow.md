# Creator Application Flow

How a fan applies to become a creator and how admins approve them.

---

## Overview

Previously, creators were made by manually editing MongoDB. Now there is a proper application flow:
Fan submits application (/apply)
↓
Application saved in MongoDB (status: "pending")
↓
Admin reviews at /admin
↓
Admin approves → user.role set to "creator"
↓
User signs out and back in → Dashboard unlocked

---

## Systems Involved
Browser           Our Server              MongoDB
│                   │                      │
▼                   ▼                      ▼
apply/page.tsx    creator-application/   CreatorApplication
admin/page.tsx    route.ts               User model
admin/route.ts

---

## Application Submission

### Step 1 — Fan Fills Application Form

**File:** `web/app/apply/page.tsx`

Fields:
- Artist/stage name (required)
- Bio (required, max 500 chars)
- Genre (multi-select)
- Instagram handle
- Sample work URL (YouTube, SoundCloud, Spotify etc.)

The page checks existing application status on load:
```typescript
// GET /api/creator-application
// Returns: { applied: true, status: "pending" | "approved" | "rejected" }
```

If already applied → shows status screen (not the form again).
If already a creator → redirects to dashboard.

### Step 2 — Submit Application (Backend)

**File:** `web/app/api/creator-application/route.ts` → POST

```typescript
// Check not already applied
const existing = await CreatorApplication.findOne({ user: user._id })
if (existing) return { alreadyApplied: true, status: existing.status }

// Save application
await CreatorApplication.create({
  user:             user._id,
  name:             body.name,
  bio:              body.bio,
  genre:            body.genre,
  instagramHandle:  body.instagramHandle,
  sampleWorkUrl:    body.sampleWorkUrl,
  status:           'pending',
})
```

---

## Admin Review

### Step 1 — Admin Views Applications

**File:** `web/app/admin/page.tsx`

Admin is identified by matching email OR Privy ID against env vars:
```typescript
const ADMIN_EMAIL    = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const ADMIN_PRIVY_ID = process.env.NEXT_PUBLIC_ADMIN_PRIVY_ID

const isAdmin = user?.email === ADMIN_EMAIL || user?.privyId === ADMIN_PRIVY_ID
```

Admin page shows:
- Stats: total users, creators, pending applications, active subscriptions
- Applications tab: all pending applications with bio, genre, links
- Subscriptions tab: all subscription records

### Step 2 — Admin Approves or Rejects

**File:** `web/app/api/admin/route.ts` → POST

```typescript
const { applicationId, action } = await req.json()
// action: "approve" | "reject"

const application = await CreatorApplication.findById(applicationId)
  .populate('user')

if (action === 'approve') {
  // 1. Update application status
  await CreatorApplication.findByIdAndUpdate(applicationId, { status: 'approved' })

  // 2. Upgrade user role
  await User.findByIdAndUpdate(application.user._id, {
    role: 'creator',
    name: application.name,
    bio:  application.bio,
    genre: application.genre,
  })
} else {
  await CreatorApplication.findByIdAndUpdate(applicationId, { status: 'rejected' })
}
```

Approval does four things:
1. Marks the application as approved
2. Sets the user's role to `"creator"`
3. Sets isVerified: true (shows verified badge on profile)
4. Pre-fills their bio and genre from the application

### Step 3 — User Gets Dashboard Access

The user must sign out and sign back in. When they do:
1. `useAuth` syncs with MongoDB
2. Gets back `role: "creator"`
3. Navbar shows Dashboard link
4. `/dashboard` layout allows access

---

## Status Screens

The apply page shows different UIs based on state:

| State | Screen |
|-------|--------|
| Not logged in | Shows form, clicking submit triggers login |
| Already creator | "You're already a creator" + link to dashboard |
| Applied, pending | "Application under review" |
| Applied, rejected | "Application not approved" |
| Just submitted | "Application submitted!" |

---

## Common Errors

### User submits twice
Backend checks for existing application and returns `alreadyApplied: true`. Frontend shows current status.

### Admin page shows "Access denied"
`NEXT_PUBLIC_ADMIN_EMAIL` env var not set or doesn't match logged-in user's email. Also check `NEXT_PUBLIC_ADMIN_PRIVY_ID`.

### User approved but still sees fan UI
They need to sign out and sign back in for `useAuth` to re-sync their role from MongoDB.
