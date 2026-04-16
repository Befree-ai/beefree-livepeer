import mongoose, { Schema, Document } from "mongoose"
import { VideoAccess, StreamStatus } from "@/types"

export interface IStreamDocument extends Document {
  title: string
  description?: string
  streamId: string
  streamKey: string
  playbackId: string
  creator: mongoose.Types.ObjectId
  access: VideoAccess
  status: StreamStatus
  viewerCount: number
  recordingPlaybackId?: string
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
}

const StreamSchema = new Schema<IStreamDocument>(
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
    streamId: {
      type: String,
      required: true,
      unique: true,
    },
    streamKey: {
      type: String,
      required: true,
      unique: true,
    },
    playbackId: {
      type: String,
      required: true,
      unique: true,
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
      enum: ["idle", "live", "ended"],
      default: "idle",
      index: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recordingPlaybackId: {
      type: String,
      default: "",
    },
    scheduledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Fetch live streams by creator
StreamSchema.index({ creator: 1, status: 1 })

export default mongoose.models.Stream ||
  mongoose.model<IStreamDocument>("Stream", StreamSchema)