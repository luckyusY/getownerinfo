import mongoose from "mongoose";
import { env } from "./env.js";

// Next.js hot-reloads modules in dev and runs serverless-style handlers in prod,
// so we cache the connection on the global object to avoid opening a new pool on
// every request / reload.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
