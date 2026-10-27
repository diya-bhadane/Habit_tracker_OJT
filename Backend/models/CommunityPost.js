/* eslint-env node */
import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    challengeName: { type: String, trim: true, default: "" },
    progressPercent: { type: Number, default: 0 },
    badgeLabel: { type: String, trim: true, default: "" },
    likes: { type: Number, default: 0 },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("CommunityPost", CommunityPostSchema);
