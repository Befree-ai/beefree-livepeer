import { NextRequest, NextResponse } from 'next/server'
import livepeer from '@/lib/livepeer'
import { ApiResponse } from '@/types'

// GET /api/playback/[playbackId]
// Fetches playback info from Livepeer
// Used by video player to get stream URLs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playbackId: string }> }
) {
  try {
    const { playbackId } = await params

    const info = await livepeer.playback.get(playbackId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { playbackInfo: info.playbackInfo },
    })
  } catch (error) {
    console.error('[GET /api/playback]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch playback info' },
      { status: 500 }
    )
  }
}