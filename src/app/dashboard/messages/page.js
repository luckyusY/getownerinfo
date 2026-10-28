import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Dashboard";
import OwnerMessages from "@/app/dashboard/owner/messages/OwnerMessages";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  guardRole(ALL_ROLES);
  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle="Threads where you are the owner and threads where you are the buyer, on one account. Contact details stay filtered until the token fee is paid."
      />
      <OwnerMessages />
    </div>
  );
}
