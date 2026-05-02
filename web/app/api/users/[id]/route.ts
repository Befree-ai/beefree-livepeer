import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { ApiResponse } from '@/types'

// GET /api/users/[id]
// Returns fan profile + who they follow
// Public route — no auth needed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await connectDB()

    const user = await User.findOne({
      _id: id,
      isBanned: false,
    })
      .select('name avatar role followersCount followingCount following createdAt')
      .lean()

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch creators they follow
    let followingCreators: any[] = []
    if (user.following && user.following.length > 0) {
      followingCreators = await User.find({
        _id: { $in: user.following },
        role: 'creator',
        isBanned: false,
      })
        .select('name avatar followersCount isVerified genre')
        .lean()
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user,
        followingCreators,
      },
    })
  } catch (error) {
    console.error('[GET /api/users/[id]]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}