import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "@/types";

export interface IUserDocument extends Document {
  privyId: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  bio?: string;
  followersCount: number;
  followingCount: number;
  following: string[];
  isBanned: boolean;
  isVerified: boolean;
  genre?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  totalEarnings: number;
  subscriptionPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    privyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      unique: true, // no two users with same email
      sparse: true, // allows multiple null/undefined
    },
    phone: {
      type: String,
      unique: true, // no two users with same phone
      sparse: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["fan", "creator"],
      default: "fan",
      index: true, // we query "all creators" frequently
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    following: {
      type: [String], // array of creator IDs
      default: [],
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    genre: {
      type: [String],
      default: [],
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    subscriptionPrice: {
      type: Number,
      default: 9900,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);
