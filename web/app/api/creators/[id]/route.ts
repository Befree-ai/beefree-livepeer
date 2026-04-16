import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Video from '@/models/Video'
import { ApiResponse, ICreator, IVideo } from '@/types'

// GET /api/creators/[id]
// Returns single creator profile + their videos
// Public route — no auth needed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params  // Next.js 16 — params is async

    await connectDB()

    // Find creator by MongoDB _id or privyId
    const creator = await User.findOne({
      _id: id,
      role: 'creator',
      isBanned: false,
    })
      .select('-__v')
      .lean()

    if (!creator) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Fetch their public videos
    const videos = await Video.find({
      creator: creator._id,
      status: 'ready',
    })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json<ApiResponse<{
      creator: ICreator
      videos: IVideo[]
    }>>({
      success: true,
      data: {
        creator: creator as unknown as ICreator,
        videos: videos as unknown as IVideo[],
      },
    })
  } catch (error) {
    console.error('[GET /api/creators/[id]]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch creator' },
      { status: 500 }
    )
  }
}