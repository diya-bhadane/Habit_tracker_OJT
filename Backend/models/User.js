import mongoose from "mongoose";

const HabitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    icon: { type: String, default: "📌" },
    iconBg: { type: String, default: "bg-sky-100 text-sky-600" },
    completions: [{ type: String }], // ISO date strings (YYYY-MM-DD)
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const NoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MoodNoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MoodDaySchema = new mongoose.Schema(
  {
    mood: { type: String, default: null }, // happy, good, neutral, low, sad
    notes: { type: [MoodNoteSchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },

    // Dashboard state
    habits: { type: [HabitSchema], default: [] },
    notes: { type: [NoteSchema], default: [] },

    // Profile fields used on the frontend
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarDataUrl: { type: String, default: "" },

    // Mood tracker logs keyed by date key (YYYY-MM-DD)
    moodLogs: {
      type: Map,
      of: MoodDaySchema,
      default: {},
    },

    // Notification & preference flags for Settings page
    notifications: {
      type: new mongoose.Schema(
        {
          habitReminders: { type: Boolean, default: true },
          moodTrackerReminders: { type: Boolean, default: false },
          weeklySummaryEmail: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
