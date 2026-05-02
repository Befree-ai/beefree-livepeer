import { NextRequest, NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { ApiResponse } from "@/types"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

async function getUser(req: NextRequest) {
  const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!authToken) return null
  const verifiedClaims = await privy.verifyAuthToken(authToken)
  await connectDB()
  return User.findOne({ privyId: verifiedClaims.userId })
}

// GET /api/follow/[creatorId]
// Check if current user follows this creator
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: true, data: { isFollowing: false } })
    }

    const isFollowing = user.following?.includes(creatorId) || false

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { isFollowing },
    })
  } catch (error) {
    console.error('[GET /api/follow]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to check follow status" },
      { status: 500 }
    )
  }
}

// POST /api/follow/[creatorId]
// Follow a creator
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (user._id.toString() === creatorId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot follow yourself" },
        { status: 400 }
      )
    }

    const creator = await User.findById(creatorId)
    if (!creator) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Creator not found" },
        { status: 404 }
      )
    }

    // Already following
    if (user.following?.includes(creatorId)) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { isFollowing: true },
      })
    }

    // Add to user's following list + increment counts
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { following: creatorId },
      $inc: { followingCount: 1 },
    })

    await User.findByIdAndUpdate(creatorId, {
      $inc: { followersCount: 1 },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { isFollowing: true },
    })
  } catch (error) {
    console.error('[POST /api/follow]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to follow" },
      { status: 500 }
    )
  }
}

// DELETE /api/follow/[creatorId]
// Unfollow a creator
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    await User.findByIdAndUpdate(user._id, {
      $pull: { following: creatorId },
      $inc: { followingCount: -1 },
    })

    await User.findByIdAndUpdate(creatorId, {
      $inc: { followersCount: -1 },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { isFollowing: false },
    })
  } catch (error) {
    console.error('[DELETE /api/follow]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to unfollow" },
      { status: 500 }
    )
  }
}