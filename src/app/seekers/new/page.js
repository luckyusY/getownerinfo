import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeekerRequestForm from "./SeekerRequestForm";

// The form is interactive, so it lives in a client child. This page stays a
// server component because SiteHeader reads the session via cookies(), which a
// client component cannot do — the same split as /seekers and /listings.
export default function NewSeekerPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <SeekerRequestForm />
      </main>
      <SiteFooter />
    </div>
  );
}
