import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Get the current session or redirect to sign-in if not authenticated.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Get the active organization for the current user.
 * Returns null if user has no active organization.
 */
export async function getActiveOrganization() {
  const session = await getSession();
  if (!session?.user) return null;

  try {
    // Get active org ID from session first (most reliable)
    const rawSession = session.session as { activeOrganizationId?: string };
    let organizationId = rawSession?.activeOrganizationId;

    // Fallback: use getActiveMember (response may be .data.organizationId or top-level .organizationId)
    if (!organizationId) {
      const activeMember = await auth.api.getActiveMember({
        headers: await headers(),
      });
      organizationId =
        (activeMember as any)?.data?.organizationId ??
        (activeMember as any)?.organizationId;
    }

    if (!organizationId) {
      console.log("[getActiveOrganization] No active organization in session");
      return null;
    }

    // Fetch full organization from DB
    const { prisma } = await import("@/lib/db");
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, logo: true, metadata: true },
    });

    if (!organization) {
      console.error("[getActiveOrganization] Organization not found in DB:", organizationId);
      return null;
    }

    return organization;
  } catch (error) {
    console.error("[getActiveOrganization] Error:", error);
    return null;
  }
}

/**
 * Require an active organization or redirect to org selection.
 * Use this in routes that need tenant context.
 */
export async function requireOrganization() {
  const session = await requireAuth();
  const org = await getActiveOrganization();
  
  if (!org) {
    redirect("/organizations");
  }
  
  return { session, organization: org };
}
