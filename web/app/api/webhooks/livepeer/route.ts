// import { NextRequest, NextResponse } from 'next/server'
// import connectDB from '@/lib/mongodb'
// import Video from '@/models/Video'
// import Stream from '@/models/Stream'

// export async function POST(req: NextRequest) {
//   try {
//     // Log raw body first — this is the most important thing
//     const rawBody = await req.text()
//     console.log('==========================================')
//     console.log('[Webhook] RAW BODY:')
//     console.log(rawBody)
//     console.log('==========================================')
//     console.log('[Webhook] HEADERS:')
//     console.log('content-type:', req.headers.get('content-type'))
//     console.log('livepeer-signature:', req.headers.get('livepeer-signature'))
//     console.log('==========================================')

//     const body = JSON.parse(rawBody)
//     console.log('[Webhook] TOP LEVEL KEYS:', Object.keys(body))

//     await connectDB()

//     // Log everything at top level so we know exact structure
//     Object.keys(body).forEach(key => {
//       console.log(`[Webhook] body.${key}:`, JSON.stringify(body[key])?.substring(0, 100))
//     })

//     return NextResponse.json({ received: true }, { status: 200 })

//   } catch (error) {
//     console.error('[Webhook Error]', String(error))
//     return NextResponse.json({ received: true }, { status: 200 })
//   }
// }

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

    await connectDB()

    switch (event) {
      case 'asset.ready': {
        const assetId  = payload?.asset?.id
        const duration = payload?.asset?.snapshot?.videoSpec?.duration || 0
        if (!assetId) break
        await Video.findOneAndUpdate(
          { assetId },
          { status: 'ready', duration: Math.round(duration) }
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