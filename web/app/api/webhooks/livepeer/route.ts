import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Video from '@/models/Video'
import Stream from '@/models/Stream'

// POST /api/webhooks/livepeer
// Livepeer calls this when asset status changes
// No auth needed — Livepeer calls this directly
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, payload } = body

    console.log('[Livepeer Webhook]', event, payload?.id)

    await connectDB()

    switch (event) {
      // Video asset finished processing
      case 'asset.ready': {
        await Video.findOneAndUpdate(
          { assetId: payload.id },
          {
            status: 'ready',
            duration: payload.videoSpec?.duration || 0,
            // Livepeer returns duration after processing
          }
        )
        break
      }

      // Video processing failed
      case 'asset.failed': {
        await Video.findOneAndUpdate(
          { assetId: payload.id },
          { status: 'failed' }
        )
        break
      }

      // Stream went live
      case 'stream.started': {
        await Stream.findOneAndUpdate(
          { streamId: payload.id },
          { status: 'live' }
        )
        break
      }

      // Stream went offline
      case 'stream.idle': {
        await Stream.findOneAndUpdate(
          { streamId: payload.id },
          { status: 'ended' }
        )
        break
      }

      default:
        console.log('[Livepeer Webhook] Unhandled event:', event)
    }

    // Always return 200 to Livepeer
    // Otherwise Livepeer will retry the webhook
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Livepeer Webhook Error]', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}