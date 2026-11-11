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
  // readyState 0 = disconnected. A connection that dropped and did not come
  // back used to stay cached forever, so every later request failed until the
  // process was restarted. Drop it and connect again instead.
  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
        // Fail in 10s rather than the 30s default: a page that cannot reach the
        // database should say so before the platform's own timeout cuts it off.
        serverSelectionTimeoutMS: 10_000,
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
