/* eslint-env node */
/* eslint-disable no-undef */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

export default connectDB;
