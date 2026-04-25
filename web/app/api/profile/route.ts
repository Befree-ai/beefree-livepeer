import { NextRequest, NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { ApiResponse } from '@/types'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

export async function PATCH(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken)

    await connectDB()

    const { name, bio, genre, socialLinks, subscriptionPrice } = await req.json()

    // Convert ₹ to paise if frontend sends rupees
    // e.g. 99 → 9900
    const priceInPaise = subscriptionPrice
      ? Math.round(Number(subscriptionPrice) * 100)
      : undefined

    const user = await User.findOneAndUpdate(
      { privyId: verifiedClaims.userId },
      {
        $set: {
          name:        name        || '',
          bio:         bio         || '',
          genre:       genre       || [],
          socialLinks: socialLinks || {},
          ...(priceInPaise !== undefined && { subscriptionPrice: priceInPaise }),
        },
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile updated',
    })
  } catch (error) {
    console.error('[PATCH /api/profile]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}