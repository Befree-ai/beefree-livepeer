// ── User ──────────────────────────────────────────
export type UserRole = "fan" | "creator"
export type PlanType = "monthly" | "yearly"
export type SubscriptionStatus = "active" | "expired" | "cancelled"
export type VideoAccess = "free" | "premium"
export type VideoStatus = "uploading" | "processing" | "ready" | "failed"
export type StreamStatus = "idle" | "live" | "ended"

export interface IUser {
  _id: string
  privyId: string          // Privy unique ID — main identifier
  email?: string
  phone?: string
  name?: string
  avatar?: string
  role: UserRole
  bio?: string
  followersCount: number
  followingCount: number
  isBanned: boolean        // banned users cannot access platform
  createdAt: Date
  updatedAt: Date
}

// Creator extends fan with extra fields
// All creators are also users
export interface ICreator extends IUser {
  role: "creator"          // narrows UserRole to only "creator"
  isVerified: boolean      // manually verified by BeeFree team
  genre?: string[]         // ["Bollywood", "Indie", "Classical"]
  socialLinks?: {
    instagram?: string
    twitter?: string
    youtube?: string
  }
  totalEarnings: number    // in paise (₹1 = 100 paise)
}

// ── Video ──────────────────────────────────────────
export interface IVideo {
  _id: string
  title: string
  description?: string
  playbackId: string       // Livepeer ID — viewers use this
  assetId: string          // Livepeer ID — for managing asset
  thumbnailUrl?: string
  duration?: number        // seconds, set after Livepeer processing
  creator: string | ICreator  // string = just ID, ICreator = populated
  access: VideoAccess
  status: VideoStatus
  viewCount: number
  likes: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// ── Stream ─────────────────────────────────────────
export interface IStream {
  _id: string
  title: string
  description?: string
  streamId: string              // Livepeer internal ID
  streamKey: string             // secret — only for broadcaster
  playbackId: string            // public — for viewers
  creator: string | ICreator
  access: VideoAccess
  status: StreamStatus
  viewerCount: number
  recordingPlaybackId?: string  // set after stream ends
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ── Subscription ───────────────────────────────────
export interface ISubscription {
  _id: string
  fan: string | IUser
  creator: string | ICreator
  status: SubscriptionStatus
  planType: PlanType
  razorpayOrderId?: string    // created when payment initiated
  razorpayPaymentId?: string  // set after payment success
  amount: number              // in paise (₹99 = 9900)
  validUntil: Date
  createdAt: Date
}

// ── API Response ───────────────────────────────────
// Use this for ALL API route responses
// Keeps response shape consistent
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}