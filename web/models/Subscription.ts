import mongoose, { Schema, Document } from "mongoose";
import { SubscriptionStatus, PlanType } from "@/types";

export interface ISubscriptionDocument extends Document {
  fan: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  planType: PlanType;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  fanName?: string;
  creatorName?: string;
  amount: number;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    fan: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
    planType: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    fanName: {
      type: String,
      default: "",
    },
    creatorName: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    validUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Most critical query: "is fan X subscribed to creator Y?"
// Runs on every premium video page load
SubscriptionSchema.index({ fan: 1, creator: 1 });

// Find all active subscriptions (for expiry cron job later)
SubscriptionSchema.index({ status: 1, validUntil: 1 });

export default mongoose.models.Subscription ||
  mongoose.model<ISubscriptionDocument>("Subscription", SubscriptionSchema);
