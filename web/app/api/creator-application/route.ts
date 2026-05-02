import { NextRequest, NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import CreatorApplication from "@/models/CreatorApplication"
import { ApiResponse } from "@/types"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// POST /api/creator-application
// Fan submits application to become a creator
export async function POST(req: NextRequest) {
  try {
    // 1. Verify auth
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    const verifiedClaims = await privy.verifyAuthToken(authToken)

    // 2. Find user
    await connectDB()
    const user = await User.findOne({ privyId: verifiedClaims.userId })
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // 3. Already a creator
    if (user.role === "creator") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You are already a creator" },
        { status: 400 }
      )
    }

    // 4. Check if already applied
    const existing = await CreatorApplication.findOne({ user: user._id })
    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          status: existing.status,
          alreadyApplied: true,
        },
        message:
          existing.status === "pending"
            ? "Your application is under review"
            : existing.status === "rejected"
            ? "Your application was not approved"
            : "Application found",
      })
    }

    // 5. Parse body
    const { name, bio, genre, instagramHandle, sampleWorkUrl } = await req.json()

    if (!name || !bio) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Name and bio are required" },
        { status: 400 }
      )
    }

    // 6. Create application
    const application = await CreatorApplication.create({
      user:            user._id,
      name,
      bio,
      genre:           genre || [],
      instagramHandle: instagramHandle || "",
      sampleWorkUrl:   sampleWorkUrl || "",
      status:          "pending",
    })

    return NextResponse.json<ApiResponse>({
      success:  true,
      message:  "Application submitted! We'll review it and get back to you.",
      data: { applicationId: application._id, status: "pending" },
    })

  } catch (error) {
    console.error("[POST /api/creator-application]", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to submit application" },
      { status: 500 }
    )
  }
}

// GET /api/creator-application
// Check current user's application status
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
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const application = await CreatorApplication.findOne({ user: user._id })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        applied:  !!application,
        status:   application?.status || null,
      },
    })
  } catch (error) {
    console.error("[GET /api/creator-application]", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}