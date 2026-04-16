import mongoose, { Schema, Document } from "mongoose"
import { VideoAccess, VideoStatus } from "@/types"

export interface IVideoDocument extends Document {
  title: string
  description?: string
  playbackId: string
  assetId: string
  thumbnailUrl?: string
  duration?: number
  creator: mongoose.Types.ObjectId
  access: VideoAccess
  status: VideoStatus
  viewCount: number
  likes: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const VideoSchema = new Schema<IVideoDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    playbackId: {
      type: String,
      required: true,
      unique: true,
    },
    assetId: {
      type: String,
      required: true,
      unique: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    access: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "failed"],
      default: "uploading",
      index: true,     // query "all ready videos" frequently
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Fetch all videos by a creator, newest first
VideoSchema.index({ creator: 1, createdAt: -1 })

// Fetch ready videos by access type
// Used on explore page: "show all free ready videos"
VideoSchema.index({ status: 1, access: 1 })

export default mongoose.models.Video ||
  mongoose.model<IVideoDocument>("Video", VideoSchema)