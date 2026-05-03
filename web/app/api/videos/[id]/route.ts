import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";
import { ApiResponse, IVideo } from "@/types";

// GET /api/videos/[id]
// Returns single video details
// Public route
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    const video = await Video.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    )
      .populate("creator", "name avatar isVerified role")
      .select("-__v")
      .lean();

    if (!video) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<IVideo>>({
      success: true,
      data: video as unknown as IVideo,
    });
  } catch (error) {
    console.error("[GET /api/videos/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch video" },
      { status: 500 },
    );
  }
}
