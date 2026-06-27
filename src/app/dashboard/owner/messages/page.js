import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Dashboard";
import OwnerMessages from "./OwnerMessages";

export default function OwnerMessagesPage() {
  guardRole(ROLES.OWNER);
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Replies are filtered until the buyer unlocks. Do not share contact details early."
      />
      <OwnerMessages />
    </div>
  );
}
