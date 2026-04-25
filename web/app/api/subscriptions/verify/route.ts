import { NextRequest, NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Subscription from '@/models/Subscription'
import { ApiResponse } from '@/types'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// POST /api/subscriptions/verify
// Called from frontend after Razorpay payment succeeds
// Verifies payment signature and activates subscription
export async function POST(req: NextRequest) {
  try {
    // 1. Verify auth
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const verifiedClaims = await privy.verifyAuthToken(authToken)

    // 2. Get payment details from frontend
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      )
    }

    // 3. Verify signature
    // Razorpay signs: order_id + "|" + payment_id with your secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[Verify] Signature mismatch')
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // 4. Connect DB + find fan
    await connectDB()
    const fan = await User.findOne({ privyId: verifiedClaims.userId })
    if (!fan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Find the pending subscription by orderId and activate it
    const subscription = await Subscription.findOneAndUpdate(
      {
        fan:             fan._id,
        razorpayOrderId: razorpay_order_id,
      },
      {
        razorpayPaymentId: razorpay_payment_id,
        status:            'active',
        validUntil:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    )

    if (!subscription) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      )
    }

    console.log('[Verify] Subscription activated:', subscription._id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        subscriptionId: subscription._id,
        validUntil:     subscription.validUntil,
      },
    })

  } catch (error) {
    console.error('[POST /api/subscriptions/verify]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}