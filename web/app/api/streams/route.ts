import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Stream from "@/models/Stream";
import livepeer from "@/lib/livepeer";
import { ApiResponse } from "@/types";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken);

    await connectDB();
    const user = await User.findOne({ privyId: verifiedClaims.userId });

    if (!user || user.role !== "creator") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Only creators can create streams" },
        { status: 403 },
      );
    }

    const { title, access } = await req.json();

    if (!title) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Title is required" },
        { status: 400 },
      );
    }

    // Create stream on Livepeer
    const response = await livepeer.stream.create({
      name: title,
      record: true, // record stream for replay
    });

    const s = response.stream;
    if (!s) throw new Error("Failed to create stream on Livepeer");

    // Save to MongoDB
    const stream = await Stream.create({
      title,
      streamId: s.id,
      streamKey: s.streamKey,
      playbackId: s.playbackId,
      creator: user._id,
      access: access || "free",
      status: "idle",
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        streamId: s.id,
        streamKey: s.streamKey,
        playbackId: s.playbackId,
        rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${s.streamKey}`,
        whipUrl: `https://livepeer.studio/webrtc/${s.streamKey}`,
        mongoId: stream._id,
      },
    });
  } catch (error) {
    console.error("[POST /api/streams]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create stream" },
      { status: 500 },
    );
  }
}
