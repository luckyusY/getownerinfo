import { redirect } from "next/navigation";

// Settings live on the profile page; keep the sidebar link working.
export default function SettingsPage() {
  redirect("/dashboard/profile");
}
