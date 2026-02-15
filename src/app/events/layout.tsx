import { redirect } from "next/navigation";
import { getActiveOrganization } from "@/lib/auth-utils";
import { AppNav } from "@/components/app-nav";

/**
 * All routes under /events require an active organization.
 * Redirect to organization selection if none is set.
 */
export default async function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organization = await getActiveOrganization();

  if (!organization) {
    redirect("/organizations");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      {children}
    </div>
  );
}
