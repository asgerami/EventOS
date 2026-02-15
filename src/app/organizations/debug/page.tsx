import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OrganizationDebugPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  let activeMember = null;
  let activeMemberError = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch (error) {
    activeMemberError = error;
  }

  let organizations: Awaited<ReturnType<typeof prisma.organization.findMany>> = [];
  let orgsError = null;
  try {
    organizations = await prisma.organization.findMany({
      include: {
        members: {
          where: { userId: session?.user?.id },
        },
      },
    });
  } catch (error) {
    orgsError = error;
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="mb-4 text-2xl font-bold">Organization Debug</h1>
      
      <div className="space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Session</h2>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Active Member</h2>
          {activeMemberError ? (
            <p className="text-red-500">Error: {String(activeMemberError)}</p>
          ) : (
            <pre className="overflow-auto text-xs">
              {JSON.stringify(activeMember, null, 2)}
            </pre>
          )}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Organizations in DB</h2>
          {orgsError ? (
            <p className="text-red-500">Error: {String(orgsError)}</p>
          ) : (
            <pre className="overflow-auto text-xs">
              {JSON.stringify(organizations, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
