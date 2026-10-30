import Link from "next/link";
import { LogIn, Plus, Search, Store } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import SeekerRequestForm from "./SeekerRequestForm";

export const dynamic = "force-dynamic";

// `POST /api/seekers` accepts these two and nobody else. Checking it here, on
// the way in, is the difference between finding out now and finding out after
// filling in seven fields and a budget.
const MAY_POST = [ROLES.BUYER, ROLES.ADMIN];

/**
 * The form is interactive, so it lives in a client child. This page stays a
 * server component because SiteHeader reads the session via cookies(), which a
 * client component cannot do — the same split as /seekers and /listings.
 *
 * It also decides whether this visitor can post at all. The form used to be
 * shown to everyone: a signed-out visitor filled it in and got a 401 on
 * submit, and an owner or agent — who can never post a request, since the
 * seeker side is the buying side — got a 403 after doing the same work. Both
 * now get told before they start, along with the thing they can actually do.
 */
export default function NewSeekerPage() {
  const session = getSession();
  const allowed = Boolean(session) && MAY_POST.includes(session.role);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {allowed ? (
          <SeekerRequestForm />
        ) : (
          <div className="page-shell">
            {session ? <WrongRole /> : <SignedOut />}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function SignedOut() {
  return (
    <Gate
      icon={LogIn}
      title="Sign in to post a request"
      body="A request is tied to your account so owners can reach you through it — and so your phone number stays hidden until someone pays to see it."
    >
      <Link href="/login?next=%2Fseekers%2Fnew" className="btn-primary">
        Sign in
      </Link>
      <Link href="/register?role=buyer" className="btn-outline">
        Create a buyer account
      </Link>
    </Gate>
  );
}

function WrongRole() {
  return (
    <Gate
      icon={Store}
      title="Requests are posted by buyers and tenants"
      body="Your account is set up for listing property, so it cannot post a request. The seeker side is the other half of the same marketplace: buyers say what they are looking for, and you pay a view token to reach them."
    >
      <Link href="/seekers" className="btn-primary">
        <Search className="h-4 w-4" /> Browse buyer requests
      </Link>
      <Link href="/dashboard/owner/listings/new" className="btn-outline">
        <Plus className="h-4 w-4" /> List a property instead
      </Link>
    </Gate>
  );
}

function Gate({ icon: Icon, title, body, children }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
      </div>
    </div>
  );
}
