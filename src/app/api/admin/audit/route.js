import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/admin/audit?action=&page= — paginated audit trail (admin).
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 25;

  const query = action ? { action } : {};
  const [entries, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "actor", model: User, select: "name email" }),
    AuditLog.countDocuments(query),
  ]);

  return ok({
    page,
    totalPages: Math.ceil(total / limit),
    total,
    entries: entries.map((e) => ({
      id: e._id.toString(),
      action: e.action,
      actorName: e.actor?.name || (e.actorRole === "system" ? "system" : "—"),
      actorRole: e.actorRole,
      targetType: e.targetType,
      targetId: e.targetId?.toString(),
      meta: e.meta,
      at: e.at,
    })),
  });
}
