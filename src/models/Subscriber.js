import mongoose from "mongoose";

const { Schema } = mongoose;

// Newsletter sign-ups from the public footer.
const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Set when the person asks to stop; the row is kept so a later re-subscribe
    // does not look like a brand new contact.
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: "footer" },
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);
