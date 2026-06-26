import mongoose from "mongoose";

const { Schema } = mongoose;

// Append-only audit trail. Never updated or deleted (spec: immutable logs).
const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: String,
    action: { type: String, required: true, index: true }, // e.g. "listing.create"
    targetType: String, // "Listing" | "User" | ...
    targetId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

/** Fire-and-forget audit write. Never throws into the caller. */
export async function audit({ actor, actorRole, action, targetType, targetId, meta }) {
  try {
    await AuditLog.create({ actor, actorRole, action, targetType, targetId, meta });
  } catch (err) {
    console.error("audit write failed:", err.message);
  }
}

export default AuditLog;
