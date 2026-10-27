/* eslint-env node */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./testdb.js";
import User from "./models/User.js";
import CommunityPost from "./models/CommunityPost.js";
import Challenge from "./models/Challenge.js";

dotenv.config();

const app = express();
app.use(cors());
// Increase JSON body size limit so avatar data URLs can be saved without errors
app.use(express.json({ limit: "20mb" }));

// connect to MongoDB
connectDB();

// Health check route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Simple ping route for testing
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Signup route
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedUsername = String(username).trim().toLowerCase();
    const plainPassword = String(password);

    if (!trimmedEmail.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists, please login." });
    }

    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      username: trimmedUsername,
      password: plainPassword,
    });

    const safeUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
    };

    return res.status(201).json({
      message: "Signup successful.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in /api/signup:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/username and password are required.",
      });
    }

    const search = String(identifier).trim().toLowerCase();
    const plainPassword = String(password);

    const user = await User.findOne({
      $or: [{ email: search }, { username: search }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User does not exist, please sign up." });
    }

    if (user.password !== plainPassword) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
    };

    return res.json({
      message: "Login successful.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in /api/login:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Helper to strip sensitive user fields
function toSafeUser(userDoc) {
  if (!userDoc) return null;
  const user = userDoc.toObject({ getters: true, virtuals: false });
  const moodLogs = {};
  if (user.moodLogs instanceof Map) {
    for (const [key, value] of user.moodLogs.entries()) {
      moodLogs[key] = value;
    }
  } else if (user.moodLogs && typeof user.moodLogs === "object") {
    Object.assign(moodLogs, user.moodLogs);
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    dob: user.dob || "",
    gender: user.gender || "",
    bio: user.bio || "",
    avatarDataUrl: user.avatarDataUrl || "",
    habits: Array.isArray(user.habits) ? user.habits : [],
    notes: Array.isArray(user.notes) ? user.notes : [],
    moodLogs,
    notifications: {
      habitReminders: user.notifications?.habitReminders ?? true,
      moodTrackerReminders: user.notifications?.moodTrackerReminders ?? false,
      weeklySummaryEmail: user.notifications?.weeklySummaryEmail ?? true,
    },
  };
}

// === User state & settings routes ===

// Get full dashboard state for a user
app.get("/api/users/:id/state", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error in GET /api/users/:id/state", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Update profile fields (name, email, username, bio, etc.) from Settings/Profile
app.patch("/api/users/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, username, dob, gender, bio, avatarDataUrl } = req.body;

    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedUsername = String(username || "").trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !trimmedUsername) {
      return res
        .status(400)
        .json({ message: "Name, email and username are required." });
    }
    if (!trimmedEmail.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const conflict = await User.findOne({
      _id: { $ne: id },
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
    });
    if (conflict) {
      return res
        .status(409)
        .json({ message: "That email or username is already in use." });
    }

    user.name = trimmedName;
    user.email = trimmedEmail;
    user.username = trimmedUsername;
    if (typeof dob === "string") user.dob = dob;
    if (typeof gender === "string") user.gender = gender;
    if (typeof bio === "string") user.bio = bio;
    if (typeof avatarDataUrl === "string") user.avatarDataUrl = avatarDataUrl;

    await user.save();
    return res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error in PATCH /api/users/:id/profile", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Update notification / settings flags
app.patch("/api/users/:id/settings", async (req, res) => {
  try {
    const { id } = req.params;
    const { habitReminders, moodTrackerReminders, weeklySummaryEmail } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notifications = {
      habitReminders:
        typeof habitReminders === "boolean"
          ? habitReminders
          : user.notifications?.habitReminders ?? true,
      moodTrackerReminders:
        typeof moodTrackerReminders === "boolean"
          ? moodTrackerReminders
          : user.notifications?.moodTrackerReminders ?? false,
      weeklySummaryEmail:
        typeof weeklySummaryEmail === "boolean"
          ? weeklySummaryEmail
          : user.notifications?.weeklySummaryEmail ?? true,
    };

    await user.save();
    return res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error in PATCH /api/users/:id/settings", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Export user data (JSON blob used by frontend download)
app.get("/api/users/:id/export", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const safeUser = toSafeUser(user);
    const payload = {
      profile: {
        name: safeUser.name,
        email: safeUser.email,
        username: safeUser.username,
        dob: safeUser.dob,
        gender: safeUser.gender,
        bio: safeUser.bio,
      },
      habits: safeUser.habits,
      notes: safeUser.notes,
      moodLogs: safeUser.moodLogs,
      notifications: safeUser.notifications,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=habitrix-export.json"
    );
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Error in GET /api/users/:id/export", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Clear habit history (completions + mood logs + notes)
app.post("/api/users/:id/clear-history", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    (user.habits || []).forEach((habit) => {
      // keep the habit but drop its completion dates
      habit.completions = [];
    });
    user.moodLogs = new Map();
    user.notes = [];

    await user.save();
    return res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error in POST /api/users/:id/clear-history", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Permanently delete a user account and related community data
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await CommunityPost.deleteMany({ userId: id });
    await Challenge.updateMany({}, { $pull: { participants: id } });
    await User.findByIdAndDelete(id);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/users/:id", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// === Habit & notes routes ===

// Create a new habit
// Create a new habit
app.post("/api/users/:id/habits", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, iconBg } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Habit name is required." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const habitId = req.body.id || String(Date.now());
    const habit = {
      id: habitId,
      name: String(name).trim(),
      description: description ? String(description).trim() : "New habit",
      icon: icon || "📌",
      iconBg: iconBg || "bg-sky-100 text-sky-600",
      completions: [],
      createdAt: new Date(),
    };

    user.habits.push(habit);
    await user.save();

    return res.status(201).json({ habits: user.habits });
  } catch (error) {
    console.error("Error in POST /api/users/:id/habits", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Toggle today completion for a habit
app.patch("/api/users/:id/habits/:habitId/toggle", async (req, res) => {
  try {
    const { id, habitId } = req.params;
    const { dateKey } = req.body;

    if (!dateKey) {
      return res.status(400).json({ message: "dateKey is required" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const habit = user.habits.find((h) => h.id === habitId);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const compactDate = String(dateKey).slice(0, 10);
    const index = (habit.completions || []).map((d) => d.slice(0, 10)).indexOf(compactDate);
    if (index >= 0) {
      habit.completions.splice(index, 1);
    } else {
      habit.completions.push(compactDate);
    }

    await user.save();

    return res.json({ habits: user.habits });
  } catch (error) {
    console.error("Error in PATCH /api/users/:id/habits/:habitId/toggle", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Delete a habit
app.delete("/api/users/:id/habits/:habitId", async (req, res) => {
  try {
    const { id, habitId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.habits = (user.habits || []).filter((h) => h.id !== habitId);
    await user.save();

    return res.json({ habits: user.habits });
  } catch (error) {
    console.error("Error in DELETE /api/users/:id/habits/:habitId", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Notes CRUD
app.post("/api/users/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Note text is required." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const note = {
      id: String(Date.now()),
      text: String(text).trim(),
      createdAt: now,
      updatedAt: now,
    };

    user.notes.unshift(note);
    await user.save();

    return res.status(201).json({ notes: user.notes });
  } catch (error) {
    console.error("Error in POST /api/users/:id/notes", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

app.patch("/api/users/:id/notes/:noteId", async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Note text is required." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const note = (user.notes || []).find((n) => n.id === noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.text = String(text).trim();
    note.updatedAt = new Date();
    await user.save();

    return res.json({ notes: user.notes });
  } catch (error) {
    console.error("Error in PATCH /api/users/:id/notes/:noteId", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

app.delete("/api/users/:id/notes/:noteId", async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notes = (user.notes || []).filter((n) => n.id !== noteId);
    await user.save();

    return res.json({ notes: user.notes });
  } catch (error) {
    console.error("Error in DELETE /api/users/:id/notes/:noteId", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Mood logs
app.put("/api/users/:id/moods/:dateKey", async (req, res) => {
  try {
    const { id, dateKey } = req.params;
    const { mood, notes } = req.body;

    const compactDate = String(dateKey).slice(0, 10);

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const safeNotes = Array.isArray(notes)
      ? notes.map((n) => ({
          id: n.id || String(Date.now()),
          text: String(n.text || "").trim(),
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        }))
      : [];

    user.moodLogs.set(compactDate, {
      mood: mood || null,
      notes: safeNotes,
    });
    await user.save();

    const updated = user.moodLogs.get(compactDate) || { mood: null, notes: [] };
    return res.json({ dateKey: compactDate, day: updated });
  } catch (error) {
    console.error("Error in PUT /api/users/:id/moods/:dateKey", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

app.delete("/api/users/:id/moods/:dateKey", async (req, res) => {
  try {
    const { id, dateKey } = req.params;
    const compactDate = String(dateKey).slice(0, 10);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.moodLogs.delete(compactDate);
    await user.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/users/:id/moods/:dateKey", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// === Community routes ===

// Helper to map CommunityPost -> API payload
function toCommunityPostPayload(postDoc, currentUserId) {
  const userRef = postDoc.userId;
  const userId = userRef && userRef._id ? userRef._id : userRef;

  const likedBy = Array.isArray(postDoc.likedBy) ? postDoc.likedBy : [];
  const currentUserStr = currentUserId ? String(currentUserId) : null;
  const likedByCurrentUser =
    !!currentUserStr && likedBy.some((u) => String(u) === currentUserStr);

  const safeLikes =
    typeof postDoc.likes === "number" ? postDoc.likes : likedBy.length;

  return {
    id: postDoc._id.toString(),
    userId: userId ? userId.toString() : null,
    authorName: userRef ? userRef.name : "Unknown",
    username: userRef ? userRef.username : "",
    avatarDataUrl: userRef ? userRef.avatarDataUrl : "",
    text: postDoc.text,
    challengeName: postDoc.challengeName,
    progressPercent: postDoc.progressPercent,
    badgeLabel: postDoc.badgeLabel,
    likes: safeLikes,
    likedByCurrentUser,
    commentsCount:
      typeof postDoc.commentsCount === "number"
        ? postDoc.commentsCount
        : Array.isArray(postDoc.comments)
        ? postDoc.comments.length
        : 0,
    comments: (postDoc.comments || []).map((c) => ({
      id: c.id,
      userId: c.userId ? c.userId.toString() : null,
      authorName: c.authorName,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt,
    })),
    createdAt: postDoc.createdAt,
  };
}

// Get latest feed posts
app.get("/api/community/feed", async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = userId ? String(userId) : null;

    const posts = await CommunityPost.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("userId", "name username avatarDataUrl");

    const feed = posts.map((post) =>
      toCommunityPostPayload(post, currentUserId)
    );

    return res.json({ feed });
  } catch (error) {
    console.error("Error in GET /api/community/feed", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Create a new community post
app.post("/api/community/posts", async (req, res) => {
  try {
    const { userId, text, challengeName, progressPercent, badgeLabel } = req.body;

    if (!userId || !text || !String(text).trim()) {
      return res.status(400).json({ message: "userId and text are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = await CommunityPost.create({
      userId,
      text: String(text).trim(),
      challengeName: challengeName || "",
      progressPercent: typeof progressPercent === "number" ? progressPercent : 0,
      badgeLabel: badgeLabel || "",
    });

    const populated = await post.populate(
      "userId",
      "name username avatarDataUrl"
    );

    return res.status(201).json({
      post: toCommunityPostPayload(populated, userId),
    });
  } catch (error) {
    console.error("Error in POST /api/community/posts", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Edit a community post (author only)
app.patch("/api/community/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;

    if (!userId || !text || !String(text).trim()) {
      return res
        .status(400)
        .json({ message: "userId and non-empty text are required." });
    }

    const post = await CommunityPost.findById(postId).populate(
      "userId",
      "name username avatarDataUrl"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const ownerRef = post.userId;
    const ownerId =
      ownerRef && ownerRef._id ? ownerRef._id.toString() : String(ownerRef);
    if (String(ownerId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts." });
    }

    post.text = String(text).trim();
    await post.save();

    return res.json({ post: toCommunityPostPayload(post, userId) });
  } catch (error) {
    console.error("Error in PATCH /api/community/posts/:postId", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Delete a community post (author only)
app.delete("/api/community/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts." });
    }

    await CommunityPost.findByIdAndDelete(postId);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/community/posts/:postId", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Toggle like for a post (per-user)
app.post("/api/community/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userIdStr = String(userId);
    const likedByArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    const existingIndex = likedByArray.findIndex(
      (u) => String(u) === userIdStr
    );

    let likedByCurrentUser = false;

    if (existingIndex >= 0) {
      // Unlike: remove from likedBy and decrement likes (not below zero)
      likedByArray.splice(existingIndex, 1);
      post.likes = Math.max(0, (post.likes || 0) - 1);
      likedByCurrentUser = false;
    } else {
      // Like: add to likedBy and increment likes
      likedByArray.push(userId);
      post.likes = (post.likes || 0) + 1;
      likedByCurrentUser = true;
    }

    post.likedBy = likedByArray;
    await post.save();

    return res.json({ likes: post.likes, likedByCurrentUser });
  } catch (error) {
    console.error("Error in POST /api/community/posts/:postId/like", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Add a comment to a post
app.post("/api/community/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;

    if (!userId || !text || !String(text).trim()) {
      return res
        .status(400)
        .json({ message: "userId and non-empty text are required." });
    }

    const [user, post] = await Promise.all([
      User.findById(userId),
      CommunityPost.findById(postId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const now = new Date();
    const comment = {
      id: String(Date.now()),
      userId,
      authorName: user.name,
      username: user.username,
      text: String(text).trim(),
      createdAt: now,
    };

    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    await post.save();

    return res.status(201).json({
      comment,
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    console.error("Error in POST /api/community/posts/:postId/comments", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Delete a comment (author of comment or post owner)
app.delete(
  "/api/community/posts/:postId/comments/:commentId",
  async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const post = await CommunityPost.findById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      const comment = (post.comments || []).find((c) => c.id === commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const isPostOwner = String(post.userId) === String(userId);
      const isCommentOwner = String(comment.userId || "") === String(userId);
      if (!isPostOwner && !isCommentOwner) {
        return res
          .status(403)
          .json({ message: "You can only delete your own comments." });
      }

      post.comments = (post.comments || []).filter((c) => c.id !== commentId);
      post.commentsCount = post.comments.length;
      await post.save();

      return res.json({ success: true, commentsCount: post.commentsCount });
    } catch (error) {
      console.error(
        "Error in DELETE /api/community/posts/:postId/comments/:commentId",
        error
      );
      return res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// Fetch challenges (seed a couple if none exist yet)
app.get("/api/community/challenges", async (req, res) => {
  try {
    const { userId } = req.query;

    let challenges = await Challenge.find({});
    if (challenges.length === 0) {
      challenges = await Challenge.insertMany([
        {
          title: "Read 30 mins daily",
          description: "Join others in building a reading habit.",
          durationLabel: "7 days",
          accent: "bg-violet-500",
          baseProgressPercent: 40,
        },
        {
          title: "5k steps daily",
          description: "Stay active and hit your step goals every day.",
          durationLabel: "30 days",
          accent: "bg-amber-500",
          baseProgressPercent: 80,
        },
      ]);
    }

    const currentUserId = userId ? String(userId) : null;
    const payload = challenges.map((ch) => {
      const joined = currentUserId
        ? (ch.participants || []).some((p) => String(p) === currentUserId)
        : false;
      return {
        id: ch._id.toString(),
        title: ch.title,
        description: ch.description,
        durationLabel: ch.durationLabel,
        accent: ch.accent,
        baseProgressPercent: ch.baseProgressPercent,
        participantsCount: (ch.participants || []).length,
        joined,
      };
    });

    return res.json({ challenges: payload });
  } catch (error) {
    console.error("Error in GET /api/community/challenges", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Toggle join/unjoin a challenge for a user
app.post("/api/community/challenges/:id/toggle-join", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    const userIdStr = String(userId);
    const idx = (challenge.participants || []).findIndex((p) => String(p) === userIdStr);
    if (idx >= 0) {
      challenge.participants.splice(idx, 1);
    } else {
      challenge.participants.push(userId);
    }

    await challenge.save();

    const joined = (challenge.participants || []).some((p) => String(p) === userIdStr);
    return res.json({
      joined,
      participantsCount: (challenge.participants || []).length,
    });
  } catch (error) {
    console.error("Error in POST /api/community/challenges/:id/toggle-join", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// Simple leaderboard based on total habit completions
app.get("/api/community/leaderboard", async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = userId ? String(userId) : null;

    const users = await User.find({}, "name username avatarDataUrl habits");

    const entries = users.map((user) => {
      const habits = Array.isArray(user.habits) ? user.habits : [];
      let totalCompletions = 0;
      habits.forEach((habit) => {
        totalCompletions += Array.isArray(habit.completions)
          ? habit.completions.length
          : 0;
      });

      const totalHabits = habits.length || 1;
      const completionRate = Math.round(totalCompletions / totalHabits);

      return {
        userId: user._id.toString(),
        name: user.name,
        username: user.username,
        avatarDataUrl: user.avatarDataUrl,
        totalCompletions,
        completionRate,
      };
    });

    // Sort all users by completion rate (highest first)
    const sorted = entries.sort((a, b) => b.completionRate - a.completionRate);
    const communitySize = sorted.length;

    // Determine current user's rank if we know who they are
    let currentUserRank = null;
    if (currentUserId) {
      const index = sorted.findIndex(
        (entry) => String(entry.userId) === currentUserId
      );
      if (index >= 0) {
        currentUserRank = index + 1;
      }
    }

    // Top 5 for the visible leaderboard list
    const leaderboard = sorted.slice(0, 5).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return res.json({ leaderboard, currentUserRank, communitySize });
  } catch (error) {
    console.error("Error in GET /api/community/leaderboard", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
