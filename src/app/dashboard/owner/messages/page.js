import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import OwnerMessages from "./OwnerMessages";

export default function OwnerMessagesPage() {
  guardRole(ROLES.OWNER);
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 text-sm text-slate-600">
        Replies are filtered until the buyer unlocks — don&apos;t share contact details early.
      </p>
      <OwnerMessages />
    </div>
  );
}
