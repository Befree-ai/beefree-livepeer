import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Subscription from "@/models/Subscription"

// GET /api/cron/expire-subscriptions
// Called automatically by Vercel Cron every day at midnight
// Also callable manually for testing
export async function GET(req: NextRequest) {
  try {
    // Security check — only Vercel cron or us can call this
    // Vercel sends this header automatically on cron calls
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const now = new Date()

    // Find and expire all subscriptions past their validUntil date
    const result = await Subscription.updateMany(
      {
        status:     "active",
        validUntil: { $lt: now },  // validUntil is in the past
      },
      {
        $set: { status: "expired" },
      }
    )

    console.log(`[Cron] Expired ${result.modifiedCount} subscriptions`)

    return NextResponse.json({
      success: true,
      expired: result.modifiedCount,
      timestamp: now.toISOString(),
    })

  } catch (error) {
    console.error("[Cron] expire-subscriptions error:", error)
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    )
  }
}