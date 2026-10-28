import mongoose from "mongoose";

const { Schema } = mongoose;

// One thread per (listing, buyer). The owner is the listing owner.
const ConversationSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    // When each side last opened the thread. Unread = messages from the other
    // side newer than this.
    buyerReadAt: { type: Date, default: null },
    ownerReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ConversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
