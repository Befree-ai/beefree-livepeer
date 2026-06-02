import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Video from "@/models/Video";
import livepeer from "@/lib/livepeer";
import { ApiResponse, IVideo } from "@/types";
import { Type } from "livepeer/models/components";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

// POST /api/videos
// Creates a new video asset on Livepeer
// Protected — creator only
export async function POST(req: NextRequest) {
  try {
    // Step 1: Verify auth token
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // Step 2: Get user from DB
    await connectDB();
    const user = await User.findOne({ privyId: verifiedClaims.userId });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Step 3: Must be a creator
    // if (user.role !== "creator") {
    //   return NextResponse.json<ApiResponse>(
    //     { success: false, error: "Only creators can upload videos" },
    //     { status: 403 },
    //   );
    // }

    // Step 4: Parse request body
    const body = await req.json();
    const { title, description, access, tags } = body;

    if (!title) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Title is required" },
        { status: 400 },
      );
    }

    // Step 5: Create asset on Livepeer
    const response = await livepeer.asset.create({
      name: title,
      playbackPolicy:
        access === "premium" ? { type: Type.Jwt } : { type: Type.Public },
    });

    const asset = response.data?.asset;
    const tusEndpoint = response.data?.tusEndpoint;

    if (!asset || !tusEndpoint) {
      throw new Error("Livepeer asset creation failed");
    }

    // Step 6: Save to MongoDB
    const video = await Video.create({
      title,
      description: description || "",
      playbackId: asset.playbackId,
      assetId: asset.id,
      creator: user._id,
      access: access || "free",
      status: "uploading",
      tags: tags || [],
    });

    return NextResponse.json<
      ApiResponse<{
        video: IVideo;
        tusEndpoint: string;
      }>
    >({
      success: true,
      data: {
        video: video.toObject() as unknown as IVideo,
        tusEndpoint,
      },
    });
  } catch (error) {
    console.error("[POST /api/videos]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create video" },
      { status: 500 },
    );
  }
}

// GET /api/videos
// Returns all public ready videos
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const creator = searchParams.get("creator") || "";

    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (creator) {
      // Creator viewing their own videos — show all statuses
      query.creator = creator;
    } else {
      // Public feed — only show ready videos
      query.status = "ready";
    }

    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate("creator", "name avatar isVerified")
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(query),
    ]);

    return NextResponse.json<
      ApiResponse<{
        videos: IVideo[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >({
      success: true,
      data: {
        videos: videos as unknown as IVideo[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/videos]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
