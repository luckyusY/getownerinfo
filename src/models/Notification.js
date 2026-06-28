import mongoose from "mongoose";

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, default: "info" }, // listing_approved | listing_rejected | unlock | message | commission | penalty | info
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

/** Fire-and-forget notification create. Never throws into the caller. */
export async function notifyUser({ user, type = "info", title, body = "", link = "" }) {
  if (!user || !title) return;
  try {
    await Notification.create({ user, type, title, body, link });
  } catch (err) {
    console.error("notifyUser failed:", err.message);
  }
}

export default Notification;
