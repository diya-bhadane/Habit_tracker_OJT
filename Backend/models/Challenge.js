/* eslint-env node */
import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    durationLabel: { type: String, trim: true, default: "" },
    accent: { type: String, trim: true, default: "bg-sky-500" },
    baseProgressPercent: { type: Number, default: 0 },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Challenge", ChallengeSchema);
