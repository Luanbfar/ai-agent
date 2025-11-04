import mongoose from "mongoose";
import { mongoURL } from "../config/loadEnv.ts";

export async function connectToDatabase() {
  try {
    await mongoose.connect(mongoURL);
    console.log("Connected to the database successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}
