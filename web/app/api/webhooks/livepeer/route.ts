import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Video from '@/models/Video'
import Stream from '@/models/Stream'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const event   = body.event
    const payload = body.payload

    console.log('[Webhook] event:', event)

    // Log full payload — helps debug structure and find thumbnail URL
    console.log('[Webhook] full payload:', JSON.stringify(payload, null, 2))

    await connectDB()

    switch (event) {
      case 'asset.ready': {
        const assetId  = payload?.asset?.id
        const snapshot = payload?.asset?.snapshot
        const duration = snapshot?.videoSpec?.duration || 0

        // Extra logging to find thumbnail URL structure
        console.log('[Webhook] asset id:', assetId)
        console.log('[Webhook] snapshot keys:', Object.keys(snapshot || {}))
        console.log('[Webhook] downloadUrl:', snapshot?.downloadUrl)
        console.log('[Webhook] playbackUrl:', snapshot?.playbackUrl)

        if (!assetId) break

        await Video.findOneAndUpdate(
          { assetId },
          {
            status:   'ready',
            duration: Math.round(duration),
          }
        )
        console.log('[Webhook] asset.ready → updated video', assetId)
        break
      }

      case 'asset.failed': {
        const assetId = payload?.asset?.id
        if (!assetId) break
        await Video.findOneAndUpdate({ assetId }, { status: 'failed' })
        console.log('[Webhook] asset.failed → updated video', assetId)
        break
      }

      case 'stream.started': {
        const streamId = payload?.id
        if (!streamId) break
        await Stream.findOneAndUpdate({ streamId }, { status: 'live' })
        console.log('[Webhook] stream.started → updated stream', streamId)
        break
      }

      case 'stream.idle': {
        const streamId = payload?.id
        if (!streamId) break
        await Stream.findOneAndUpdate({ streamId }, { status: 'ended' })
        console.log('[Webhook] stream.idle → updated stream', streamId)
        break
      }

      default:
        console.log('[Webhook] Unhandled event:', event)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[Webhook Error]', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}