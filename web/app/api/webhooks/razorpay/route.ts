import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import Subscription from '@/models/Subscription'

// POST /api/webhooks/razorpay
// Razorpay calls this automatically when payment is captured
// This is a backup — in case frontend verify call fails
// (browser closed, network error etc)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // 1. Verify webhook signature
    // Razorpay signs the raw body with your webhook secret
    // We use KEY_SECRET here — in production set a separate webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('[Razorpay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // 2. Parse body
    const body = JSON.parse(rawBody)
    const event = body.event

    console.log('[Razorpay Webhook] Event:', event)

    // 3. Handle payment.captured event
    if (event === 'payment.captured') {
      const payment = body.payload?.payment?.entity
      const orderId   = payment?.order_id
      const paymentId = payment?.id

      if (!orderId || !paymentId) {
        console.error('[Razorpay Webhook] Missing orderId or paymentId')
        return NextResponse.json({ received: true })
      }

      await connectDB()

      // Find subscription by orderId and activate if not already active
      const subscription = await Subscription.findOneAndUpdate(
        {
          razorpayOrderId: orderId,
          status: { $ne: 'active' }, // only update if not already active
        },
        {
          razorpayPaymentId: paymentId,
          status:            'active',
          validUntil:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      )

      if (subscription) {
        console.log('[Razorpay Webhook] Subscription activated via webhook:', subscription._id)
      } else {
        console.log('[Razorpay Webhook] Subscription already active or not found for orderId:', orderId)
      }
    }

    // Always return 200 to Razorpay
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[Razorpay Webhook Error]', error)
    // Still return 200 so Razorpay doesn't retry
    return NextResponse.json({ received: true })
  }
}