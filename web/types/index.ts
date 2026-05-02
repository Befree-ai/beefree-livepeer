// ── User ──────────────────────────────────────────
export type UserRole = "fan" | "creator";
export type PlanType = "monthly" | "yearly";
export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";
export type VideoAccess = "free" | "premium";
export type VideoStatus = "uploading" | "processing" | "ready" | "failed";
export type StreamStatus = "idle" | "live" | "ended";

export interface IUser {
  _id: string;
  privyId: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  bio?: string;
  genre?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  followersCount: number;
  followingCount: number;
  following?: string[];
  walletAddress?: string;
  isVerified?: boolean;
  isBanned: boolean;
  totalEarnings?: number;
  subscriptionPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creator extends user — narrows role to "creator"
export interface ICreator extends IUser {
  role: "creator";
  isVerified: boolean;
  isFollowing?: boolean;
  genre?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  totalEarnings: number;
  subscriptionPrice: number;
}

// ── Video ──────────────────────────────────────────
export interface IVideo {
  _id: string;
  title: string;
  description?: string;
  playbackId: string;
  assetId: string;
  thumbnailUrl?: string;
  duration?: number;
  creator: string | ICreator;
  access: VideoAccess;
  status: VideoStatus;
  viewCount: number;
  likes: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Stream ─────────────────────────────────────────
export interface IStream {
  _id: string;
  title: string;
  description?: string;
  streamId: string;
  streamKey: string;
  playbackId: string;
  creator: string | ICreator;
  access: VideoAccess;
  status: StreamStatus;
  viewerCount: number;
  recordingPlaybackId?: string;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Subscription ───────────────────────────────────
export interface ISubscription {
  _id: string;
  fan: string | IUser;
  creator: string | ICreator;
  fanName: string;
  creatorName: string;
  status: SubscriptionStatus;
  planType: PlanType;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  validUntil: Date;
  createdAt: Date;
}

// ── API Response ───────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}