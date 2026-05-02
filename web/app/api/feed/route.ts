import { NextRequest, NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Video from "@/models/Video"
import { ApiResponse } from "@/types"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// GET /api/feed
// Returns personalised feed for logged in user
// Mix of: videos from followed creators + discovery
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page  = parseInt(searchParams.get("page") || "1")
    const limit = 12
    const skip  = (page - 1) * limit

    await connectDB()

    // Try to get auth token — optional (feed works logged out too)
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
    let following: string[] = []

    if (authToken) {
      try {
        const verifiedClaims = await privy.verifyAuthToken(authToken)
        const user = await User.findOne({ privyId: verifiedClaims.userId })
        if (user?.following?.length) {
          following = user.following
        }
      } catch {
        // Token invalid — treat as logged out
      }
    }

    let feedVideos = []

    if (following.length > 0) {
      // Step 1: Get videos from followed creators
      const followingVideos = await Video.find({
        creator: { $in: following },
        status:  "ready",
      })
        .populate("creator", "name avatar isVerified")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()

      // Step 2: Get discovery videos (not from followed creators)
      const discoveryVideos = await Video.find({
        creator: { $nin: following },
        status:  "ready",
      })
        .populate("creator", "name avatar isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      // Mix: following first then discovery
      feedVideos = [...followingVideos, ...discoveryVideos]
        .slice(0, limit)

    } else {
      // No following — show all videos (discovery mode)
      feedVideos = await Video.find({ status: "ready" })
        .populate("creator", "name avatar isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        videos: feedVideos,
        page,
        hasMore: feedVideos.length === limit,
      },
    })
  } catch (error) {
    console.error("[GET /api/feed]", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch feed" },
      { status: 500 }
    )
  }
}