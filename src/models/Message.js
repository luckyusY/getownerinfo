import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderSide: { type: String, enum: ["buyer", "owner"], required: true },
    body: { type: String, required: true },

    // Blocked by the pre-unlock content filter: stored for audit, not delivered
    // to the other party.
    blocked: { type: Boolean, default: false },
    blockedReasons: { type: [String], default: [] },

    // Set when an admin/manager sent/replied on behalf of a participant.
    onBehalfBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    onBehalfByRole: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
