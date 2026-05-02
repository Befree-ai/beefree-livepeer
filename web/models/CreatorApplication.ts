import mongoose, { Schema, Document } from "mongoose"

export type ApplicationStatus = "pending" | "approved" | "rejected"

export interface ICreatorApplicationDocument extends Document {
  user: mongoose.Types.ObjectId
  name: string
  bio: string
  genre: string[]
  instagramHandle: string
  sampleWorkUrl: string
  status: ApplicationStatus
  createdAt: Date
  updatedAt: Date
}

const CreatorApplicationSchema = new Schema<ICreatorApplicationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,   // one application per user
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 500,
    },
    genre: {
      type: [String],
      default: [],
    },
    instagramHandle: {
      type: String,
      default: "",
      trim: true,
    },
    sampleWorkUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.CreatorApplication ||
  mongoose.model<ICreatorApplicationDocument>(
    "CreatorApplication",
    CreatorApplicationSchema
  )