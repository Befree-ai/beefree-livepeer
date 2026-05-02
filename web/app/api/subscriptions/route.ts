import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import Razorpay from "razorpay";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { ApiResponse } from "@/types";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/subscriptions
// Fan initiates subscription to a creator
// Creates Razorpay order + pending subscription in DB
export async function POST(req: NextRequest) {
  try {
    // 1. Verify auth
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // 2. Connect DB + find fan
    await connectDB();
    const fan = await User.findOne({ privyId: verifiedClaims.userId });
    if (!fan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // 3. Get creatorId from body
    const { creatorId } = await req.json();
    if (!creatorId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "creatorId is required" },
        { status: 400 },
      );
    }

    // 4. Find creator + get their subscription price
    const creator = await User.findOne({
      _id: creatorId,
      role: "creator",
      isBanned: false,
    });
    if (!creator) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Creator not found" },
        { status: 404 },
      );
    }

    // 5. Check if already actively subscribed
    const existing = await Subscription.findOne({
      fan: fan._id,
      creator: creator._id,
      status: "active",
      validUntil: { $gt: new Date() },
    });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Already subscribed" },
        { status: 400 },
      );
    }

    // Clean up any stale pending subscriptions older than 24 hours
    // These are orders where fan never completed payment
    await Subscription.deleteMany({
      fan: fan._id,
      creator: creator._id,
      status: "pending",
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // 6. Create Razorpay order
    const amount = creator.subscriptionPrice || 9900; // paise
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sub_${Date.now()}`,
    });

    // 7. Save pending subscription in MongoDB
    // status is "pending" until payment is verified
    // Only becomes "active" after signature verification in /verify route
    const subscription = await Subscription.create({
      fan: fan._id,
      creator: creator._id,
      fanName: fan.name || fan.email || "",
      creatorName: creator.name || "",
      status: "pending",
      planType: "monthly",
      razorpayOrderId: order.id,
      amount,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orderId: order.id,
        amount,
        currency: "INR",
        subscriptionId: subscription._id,
        creatorName: creator.name,
      },
    });
  } catch (error) {
    console.error("[POST /api/subscriptions]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

// GET /api/subscriptions?creatorId=xxx
// Check if current user is subscribed to a creator
export async function GET(req: NextRequest) {
  try {
    // 1. Verify auth
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // 2. Get creatorId from query params
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");
    if (!creatorId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "creatorId is required" },
        { status: 400 },
      );
    }

    // 3. Connect DB + find fan
    await connectDB();
    const fan = await User.findOne({ privyId: verifiedClaims.userId });
    if (!fan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // 4. Check subscription
    const subscription = await Subscription.findOne({
      fan: fan._id,
      creator: creatorId,
      status: "active",
      validUntil: { $gt: new Date() },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        subscribed: !!subscription,
        validUntil: subscription?.validUntil || null,
      },
    });
  } catch (error) {
    console.error("[GET /api/subscriptions]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to check subscription" },
      { status: 500 },
    );
  }
}
