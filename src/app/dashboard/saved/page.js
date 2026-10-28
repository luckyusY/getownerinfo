import Link from "next/link";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Dashboard";
import SavedListings from "@/app/dashboard/buyer/SavedListings";

export const dynamic = "force-dynamic";

export default function SavedListingsPage() {
  guardRole(ALL_ROLES);

  return (
    <div>
      <PageHeader
        title="Saved listings"
        subtitle="Your shortlist. Saving a listing never reveals your interest to the owner."
        actions={<Link href="/listings" className="btn-primary">Browse listings</Link>}
      />
      <div className="mt-6">
        <SavedListings />
      </div>
    </div>
  );
}
