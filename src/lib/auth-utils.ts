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

  // better-auth organization plugin stores activeOrganizationId in session
  // We need to fetch the full organization details
  const activeOrgId = (session as any).activeOrganizationId;
  
  if (!activeOrgId) return null;

  // TODO: Fetch organization from database
  // For now, return the ID
  return { id: activeOrgId };
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
