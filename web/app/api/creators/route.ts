import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { ApiResponse, ICreator } from '@/types'

// GET /api/creators
// Returns all verified creators
// Public route — no auth needed
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const genre = searchParams.get('genre') || ''

    const skip = (page - 1) * limit

    // Build query
    const query: Record<string, unknown> = {
      role: 'creator',
      isBanned: false,
    }

    // Filter by genre if provided
    if (genre) {
      query.genre = { $in: [genre] }
    }

    const [creators, total] = await Promise.all([
      User.find(query)
        .select('-__v')           // exclude mongoose version key
        .sort({ followersCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),                  // returns plain JS object, faster
      User.countDocuments(query),
    ])

    return NextResponse.json<ApiResponse<{
      creators: ICreator[]
      total: number
      page: number
      totalPages: number
    }>>({
      success: true,
      data: {
        creators: creators as unknown as ICreator[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/creators]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch creators' },
      { status: 500 }
    )
  }
}