# Auth Flow

How users sign up, log in, and how their identity is verified on every API request.

---

## Overview

LyveFree uses **Privy** for authentication. Privy handles the login UI, OTP delivery, Google OAuth, and JWT issuance. We never store passwords. After login, Privy gives us a JWT token which we verify on our backend to identify the user.

---

## Systems Involved

```
Browser          Privy            Our Server       MongoDB
  │                │                  │               │
  │                │                  │               │
  ▼                ▼                  ▼               ▼
useAuth.ts     Privy SDK         auth/sync         User model
providers.tsx  auth servers      route.ts          users collection
Navbar.tsx
```

---

## Step-by-Step Flow

### Step 1 — App Initializes

**File:** `web/app/providers.tsx`

```typescript
// Wraps entire app with PrivyProvider
// This makes Privy hooks available everywhere
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    loginMethods: ['email', 'sms', 'google', 'wallet'],
    embeddedWallets: {
      ethereum: { createOnLogin: 'users-without-wallets' }
    }
  }}
>
  {children}
</PrivyProvider>
```

**File:** `web/app/layout.tsx`

```typescript
// Root layout wraps everything in Providers
// Every page has access to Privy context
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

When the page loads, Privy SDK initializes and checks if the user has an existing session (stored in browser). `ready` becomes `true` when initialization is complete.

---

### Step 2 — User Clicks Login

**File:** `web/components/layout/Navbar.tsx`

```typescript
const { ready, authenticated, login, logout, user } = useAuth()

// Clicking "Sign in" calls Privy's login modal
<Button onClick={login}>Sign in</Button>
```

`login()` comes from `usePrivy()` (Privy's hook). It opens Privy's login modal which handles:
- Email OTP — user enters email, Privy sends 6-digit code
- SMS OTP — user enters phone, Privy sends SMS
- Google OAuth — redirect to Google, back to app
- Wallet — MetaMask / WalletConnect

Privy handles ALL of this. We write zero auth logic for the login UI.

---

### Step 3 — Privy Issues JWT

After the user successfully verifies (enters OTP, approves Google, etc.), Privy:
1. Creates a session for the user
2. Issues a signed JWT (JSON Web Token)
3. Stores it in the browser (localStorage/cookie)

The JWT contains:
```json
{
  "userId": "did:privy:cmo14av1h00ad0bld197djrfe",
  "iss": "privy.io",
  "exp": 1776634567,
  ...
}
```

`userId` is the Privy-assigned unique identifier for this user. We use this as the primary lookup key in our MongoDB (`privyId` field).

---

### Step 4 — useAuth Syncs to MongoDB

**File:** `web/hooks/useAuth.ts`

```typescript
export function useAuth(): UseAuthReturn {
  const {
    ready,
    authenticated,
    user: privyUser,  // Privy's user object
    login,
    logout,
    getAccessToken,   // returns the JWT string
  } = usePrivy()

  const [user, setUser] = useState<IUser | null>(null)

  const syncUser = useCallback(async () => {
    if (!authenticated || !privyUser) {
      setUser(null)
      return
    }

    // Get the JWT token
    const token = await getAccessToken()

    // Extract user details from Privy's user object
    // Privy stores linked accounts separately
    const email = privyUser.email?.address
    const phone = privyUser.phone?.number
    const googleAccount = privyUser.google

    // Name priority: Google name > email prefix > phone number
    const name = googleAccount?.name
      || (email ? email.split('@')[0] : '')
      || (phone ? phone : '')
      || ''

    const avatar = googleAccount?.profilePictureUrl || ''

    // Call our backend to sync this user to MongoDB
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,  // send JWT in header
      },
      body: JSON.stringify({ email, phone, name, avatar }),
    })

    const data = await response.json()
    if (data.success) {
      setUser(data.data)  // store MongoDB user in React state
    }
  }, [authenticated, privyUser, getAccessToken])

  // Auto-sync when auth state changes
  useEffect(() => {
    if (ready) {
      syncUser()
    }
  }, [ready, authenticated, syncUser])

  return { ready, authenticated, login, logout, user, isLoading, syncUser }
}
```

**Why do we sync to MongoDB?**
Privy knows the user's identity (who they are) but knows nothing about LyveFree-specific data (their role, bio, subscription price, etc.). MongoDB is where all LyveFree-specific user data lives.

**Name extraction logic:**
- Google login → use Google display name (e.g. "Om Santoshwar")
- Email login → use part before @ (e.g. "omsantoshwar02@gmail.com" → "omsantoshwar02")
- SMS login → use phone number as temporary name
- Wallet login → empty string (no name available)

---

### Step 5 — Backend Verifies JWT and Finds/Creates User

**File:** `web/app/api/auth/sync/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // 1. Extract JWT from Authorization header
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '')

  // 2. Verify JWT with Privy SDK
  // This checks: signature is valid, token not expired, issued by Privy
  // If invalid: throws an error → we return 401
  const verifiedClaims = await privy.verifyAuthToken(authToken)
  const privyId = verifiedClaims.userId  // "did:privy:xxx"

  // 3. Connect to MongoDB
  await connectDB()

  // 4. Find existing user or create new one
  let user = await User.findOne({ privyId })

  const body = await req.json()  // { email, phone, name, avatar }

  if (!user) {
    // First time this user logs in — create their document
    user = await User.create({
      privyId,
      email: body.email || undefined,
      phone: body.phone || undefined,
      name: body.name || '',
      avatar: body.avatar || '',
      role: 'fan',  // everyone starts as fan
                    // creators are upgraded manually in MongoDB
    })
  } else {
    // Returning user — update name/avatar if they were empty
    // This handles the case where email login users previously had no name
    if (!user.name && body.name) {
      user = await User.findOneAndUpdate(
        { privyId },
        { $set: { name: body.name, avatar: body.avatar || '' } },
        { new: true }
      )
    }
  }

  // 5. Check if banned
  if (user.isBanned) {
    return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 })
  }

  // 6. Return user data to frontend
  return NextResponse.json({
    success: true,
    data: {
      _id: user._id.toString(),
      privyId: user.privyId,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      role: user.role,     // "fan" or "creator"
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  })
}
```

---

### Step 6 — User State Available Everywhere

Back in `useAuth.ts`, after the sync call succeeds:

```typescript
setUser(data.data)  // MongoDB user document stored in React state
```

Now `user` is available in any component that calls `useAuth()`:

```typescript
// In Navbar.tsx
const { user, authenticated, login, logout } = useAuth()

// user._id — MongoDB ObjectId as string
// user.name — display name
// user.role — "fan" or "creator"
// user.email — email address
```

---

## How Auth Works on Every API Request

Every protected API route follows this pattern:

```typescript
// 1. Get token from header
const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
if (!authToken) return 401

// 2. Verify with Privy (this is the security check)
const verifiedClaims = await privy.verifyAuthToken(authToken)

// 3. Find user in our DB using Privy's userId
const user = await User.findOne({ privyId: verifiedClaims.userId })
if (!user) return 404

// 4. Now we know who this user is and can check their role, subscriptions etc.
```

The JWT is sent in every API call from the frontend:

```typescript
// How frontend sends token with every API request
const token = await getAccessToken()  // from usePrivy()

fetch('/api/some-route', {
  headers: {
    Authorization: `Bearer ${token}`,
  }
})
```

---

## How Creator Role Works

There is no "become a creator" flow in the UI. Roles are assigned manually:

1. User signs up → `role: "fan"` in MongoDB
2. LyveFree team goes to MongoDB Atlas
3. Finds the user document
4. Changes `role: "fan"` → `role: "creator"`

After that, when the user logs in again, `useAuth` syncs and gets `role: "creator"`, which unlocks the Dashboard.

**Why manual?** Prevents spam accounts from becoming creators. In the future, this can be automated with a creator application form.

---

## Dashboard Auth Guard

**File:** `web/app/dashboard/layout.tsx`

```typescript
// This wraps ALL /dashboard/* routes
export default function DashboardLayout({ children }) {
  const { ready, authenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return

    // Not logged in → go to home page
    if (!authenticated) {
      router.push('/')
      return
    }

    // Logged in but not creator → go to explore
    if (user && user.role !== 'creator') {
      router.push('/explore')
    }
  }, [ready, authenticated, user])

  // Show spinner while auth initializes
  if (!ready || !user) {
    return <LoadingSpinner />
  }

  return <DashboardUI>{children}</DashboardUI>
}
```

Individual dashboard pages (`/dashboard/upload`, `/dashboard/stream`, etc.) don't need auth checks — the layout handles it for all of them.

---

## Data Flow Diagram

```
Browser                    Privy                   Our Server          MongoDB
   │                          │                         │                  │
   │── click "Sign in" ───────►│                         │                  │
   │                          │                         │                  │
   │   Privy modal opens      │                         │                  │
   │   (email OTP / SMS       │                         │                  │
   │    / Google / wallet)    │                         │                  │
   │                          │                         │                  │
   │   User verifies ─────────►│                         │                  │
   │                          │ session created         │                  │
   │◄── JWT token ────────────│                         │                  │
   │    stored in browser     │                         │                  │
   │                          │                         │                  │
   │  useAuth detects login   │                         │                  │
   │  getAccessToken() ───────►│                         │                  │
   │◄── JWT string ───────────│                         │                  │
   │                          │                         │                  │
   │── POST /api/auth/sync ───────────────────────────►│                  │
   │   Authorization: Bearer <jwt>                      │                  │
   │   body: { email, name, avatar }                    │                  │
   │                          │                         │                  │
   │                          │         privy.verifyAuthToken(jwt)         │
   │                          │◄────────────────────────│                  │
   │                          │         { userId }       │                  │
   │                          │                         │                  │
   │                          │              User.findOne({ privyId }) ───►│
   │                          │◄──────────────────────────── user/null ───│
   │                          │                         │                  │
   │                          │              User.create(...) ────────────►│ (if new)
   │                          │◄──────────────────────────── user ────────│
   │                          │                         │                  │
   │◄── { success, user } ──────────────────────────────│                  │
   │                          │                         │                  │
   │  setUser(data.data)      │                         │                  │
   │  user.role === "creator" │                         │                  │
   │  → show Dashboard link   │                         │                  │
```

---

## Common Errors

### "No auth token provided" (401)
The frontend didn't send the `Authorization` header. Check that `getAccessToken()` is called before the fetch.

### "Authentication failed" (401)
The JWT is expired or invalid. This happens if:
- The user's session expired (Privy JWTs last ~24 hours)
- The wrong `PRIVY_APP_SECRET` is set in `.env.local`
- The `NEXT_PUBLIC_PRIVY_APP_ID` doesn't match the app

### "Account suspended" (403)
The user's `isBanned` field is `true` in MongoDB. Change it to `false` in MongoDB Atlas to restore access.

### User has no name after email login
This was a bug we fixed. The auth sync now updates the name if it's empty. If an existing user still shows "?" it means they logged in before the fix. Solution: in MongoDB, manually set their `name` field, or they can sign out and sign back in.