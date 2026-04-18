import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Video from '@/models/Video'
import Stream from '@/models/Stream'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Livepeer sends different payload structure
    // event is at top level, payload is the whole object
    const event   = body.event
    const payload = body.payload || body  // fallback to whole body

    console.log('[Livepeer Webhook] Event:', event)
    console.log('[Livepeer Webhook] Payload ID:', payload?.id)

    await connectDB()

    switch (event) {
      case 'asset.ready': {
        const assetId = payload?.id || payload?.assetId
        if (!assetId) break

        await Video.findOneAndUpdate(
          { assetId },
          {
            status:   'ready',
            duration: Math.round(payload?.videoSpec?.duration || payload?.duration || 0),
          }
        )
        console.log('[Webhook] asset.ready → updated video', assetId)
        break
      }

      case 'asset.failed': {
        const assetId = payload?.id || payload?.assetId
        if (!assetId) break

        await Video.findOneAndUpdate(
          { assetId },
          { status: 'failed' }
        )
        console.log('[Webhook] asset.failed → updated video', assetId)
        break
      }

      case 'stream.started': {
        const streamId = payload?.id || payload?.streamId
        if (!streamId) break

        await Stream.findOneAndUpdate(
          { streamId },
          { status: 'live' }
        )
        console.log('[Webhook] stream.started → updated stream', streamId)
        break
      }

      case 'stream.idle': {
        const streamId = payload?.id || payload?.streamId
        if (!streamId) break

        await Stream.findOneAndUpdate(
          { streamId },
          { status: 'ended' }
        )
        console.log('[Webhook] stream.idle → updated stream', streamId)
        break
      }

      default:
        console.log('[Webhook] Unhandled event:', event)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[Webhook Error]', error)
    // Still return 200 so Livepeer doesn't keep retrying
    return NextResponse.json({ received: true }, { status: 200 })
  }
}