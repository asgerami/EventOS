import { redirect } from "next/navigation";
import { getActiveOrganization } from "@/lib/auth-utils";

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

  return <>{children}</>;
}
