import { NextRequest, NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Subscription from "@/models/Subscription"
import { ApiResponse } from "@/types"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// GET /api/earnings
// Returns earnings data for the logged in creator
export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken)
    await connectDB()

    const user = await User.findOne({ privyId: verifiedClaims.userId })
    if (!user || user.role !== "creator") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Creator not found" },
        { status: 404 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      activeSubscribers,
      allSubscriptions,
      monthlySubscriptions,
      recentSubscriptions,
    ] = await Promise.all([
      // Count active subscribers
      Subscription.countDocuments({
        creator: user._id,
        status: 'active',
        validUntil: { $gt: now },
      }),

      // All active subscriptions for total earnings
      Subscription.find({
        creator: user._id,
        status: 'active',
      }).select('amount'),

      // This month's subscriptions
      Subscription.find({
        creator: user._id,
        status: 'active',
        createdAt: { $gte: startOfMonth },
      }).select('amount'),

      // Recent subscriptions for the table
      Subscription.find({
        creator: user._id,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('fanName amount status validUntil createdAt'),
    ])

    // Calculate totals
    const totalEarnings = allSubscriptions.reduce(
      (sum, sub) => sum + sub.amount, 0
    )
    const monthlyRevenue = monthlySubscriptions.reduce(
      (sum, sub) => sum + sub.amount, 0
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        activeSubscribers,
        totalEarnings,
        monthlyRevenue,
        recentSubscriptions,
      },
    })
  } catch (error) {
    console.error('[GET /api/earnings]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch earnings" },
      { status: 500 }
    )
  }
}