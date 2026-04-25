import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { signAccessJwt } from "@livepeer/core/crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Video from "@/models/Video";
import Subscription from "@/models/Subscription";
import { ApiResponse } from "@/types";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

// GET /api/videos/[id]/jwt
// Returns a signed Livepeer JWT for premium video playback
// Only called for premium videos
// Checks: user is logged in + subscribed to creator (or IS the creator)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    // 1. Get video from DB
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    // 2. Free videos don't need JWT
    if (video.access === "free") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This video does not require access control" },
        { status: 400 },
      );
    }

    // 3. Verify user is logged in via Privy JWT
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // 4. Find user in our DB
    const user = await User.findOne({ privyId: verifiedClaims.userId });
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // 5. Creator can always watch their own content — skip subscription check
    const isCreator = user._id.toString() === video.creator.toString();

    if (!isCreator) {
      // 6. Fan must have active subscription to this creator
      const subscription = await Subscription.findOne({
        fan:        user._id,
        creator:    video.creator,
        status:     "active",
        validUntil: { $gt: new Date() },
      });

      if (!subscription) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Subscribe to watch this video" },
          { status: 403 },
        );
      }
    }

    // 7. Sign Livepeer JWT
    // Keys are stored as base64 encoded PEM in env
    // signAccessJwt handles the base64 decoding internally —
    // we pass the env variable directly without any manual decoding
    const jwt = await signAccessJwt({
      privateKey: process.env.LIVEPEER_PRIVATE_KEY!,
      publicKey:  process.env.LIVEPEER_PUBLIC_KEY!,
      issuer:     'https://beefree-nine.vercel.app',
      playbackId: video.playbackId,
      expiration: 3600, // 1 hour in seconds
      custom: {
        userId: user._id.toString(),
      },
    })

    console.log('[JWT] Generated for playbackId:', video.playbackId, 'length:', jwt.length)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { jwt },
    });

  } catch (error) {
    console.error("[GET /api/videos/[id]/jwt]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to generate access token" },
      { status: 500 },
    );
  }
}