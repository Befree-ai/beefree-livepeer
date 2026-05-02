import { NextRequest, NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import CreatorApplication from "@/models/CreatorApplication"
import Subscription from "@/models/Subscription"
import { ApiResponse } from "@/types"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL!
const ADMIN_PRIVY_ID = process.env.ADMIN_PRIVY_ID!

// Verify admin access
async function verifyAdmin(req: NextRequest) {
  const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!authToken) return null

  const verifiedClaims = await privy.verifyAuthToken(authToken)
  await connectDB()
  const user = await User.findOne({ privyId: verifiedClaims.userId })

  if (!user || (user.email !== ADMIN_EMAIL && user.privyId !== ADMIN_PRIVY_ID)) return null
  return user
}

// GET /api/admin
// Returns stats + pending applications + subscriptions
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const section = searchParams.get("section") || "overview"

    await connectDB()

    if (section === "overview") {
      // Quick stats
      const [
        totalUsers,
        totalCreators,
        pendingApplications,
        activeSubscriptions,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "creator" }),
        CreatorApplication.countDocuments({ status: "pending" }),
        Subscription.countDocuments({ status: "active" }),
      ])

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          totalUsers,
          totalCreators,
          pendingApplications,
          activeSubscriptions,
        },
      })
    }

    if (section === "applications") {
      const applications = await CreatorApplication.find({ status: "pending" })
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .lean()

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { applications },
      })
    }

    if (section === "subscriptions") {
      const subscriptions = await Subscription.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { subscriptions },
      })
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Invalid section" },
      { status: 400 }
    )

  } catch (error) {
    console.error("[GET /api/admin]", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch admin data" },
      { status: 500 }
    )
  }
}

// POST /api/admin
// Approve or reject a creator application
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const { applicationId, action } = await req.json()

    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid request" },
        { status: 400 }
      )
    }

    await connectDB()

    // Find application
    const application = await CreatorApplication.findById(applicationId)
    if (!application) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Application not found" },
        { status: 404 }
      )
    }

    if (action === "approve") {
      // Update application status
      application.status = "approved"
      await application.save()

      // Update user role to creator
      await User.findByIdAndUpdate(application.user, {
        $set: {
          role:       "creator",
          isVerified: true,
          // Pre-fill bio and genre from application
          bio:        application.bio,
          genre:      application.genre,
        },
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Application approved. User is now a creator.",
      })
    }

    if (action === "reject") {
      application.status = "rejected"
      await application.save()

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Application rejected.",
      })
    }

  } catch (error) {
    console.error("[POST /api/admin]", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to process application" },
      { status: 500 }
    )
  }
}