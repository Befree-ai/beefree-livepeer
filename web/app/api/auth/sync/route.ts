import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse, IUser } from "@/types";

// Initialize Privy server client
// Used to verify the auth token sent from frontend
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function POST(req: NextRequest) {
  try {
    // Step 1: Get auth token from request header
    // Frontend sends this after Privy login
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No auth token provided" },
        { status: 401 },
      );
    }

    // Step 2: Verify token with Privy
    // This confirms the user actually logged in with Privy
    // and the token wasn't forged
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    const privyId = verifiedClaims.userId;

    // Step 3: Connect to MongoDB
    await connectDB();

    // Step 4: Find or create user
    // If user logged in before → find them
    // If first time → create new user
    let user = await User.findOne({ privyId });

    const body = await req.json().catch(() => ({}));

    if (!user) {
      // New user — create
      user = await User.create({
        privyId,
        email: body.email || undefined,
        phone: body.phone || undefined,
        name: body.name || "",
        avatar: body.avatar || "",
        role: "fan",
      });
    } else {
      // Existing user — update name/avatar if empty
      if (!user.name && body.name) {
        user = await User.findOneAndUpdate(
          { privyId },
          { $set: { name: body.name, avatar: body.avatar || "" } },
          { new: true },
        );
      }
    }

    // Step 5: Check if banned
    if (user.isBanned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Account suspended" },
        { status: 403 },
      );
    }

    // Step 6: Return user data to frontend
    return NextResponse.json<ApiResponse<IUser>>({
      success: true,
      data: {
        _id: user._id.toString(),
        privyId: user.privyId,
        email: user.email,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("[AUTH SYNC ERROR]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Authentication failed" },
      { status: 401 },
    );
  }
}
