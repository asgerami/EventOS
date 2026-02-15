import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SuperAdminPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { events: true, members: true },
      },
    },
  });

  const [totalEvents, totalMembers] = await Promise.all([
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.user.count(),
  ]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Super Admin</h1>
          <p className="text-muted-foreground">
            Tenant management and system-wide overview
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{orgs.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{totalEvents}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{totalMembers}</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenants (organizations)</CardTitle>
            <CardDescription>
              All organizations. Members and events are scoped per tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No organizations yet.
              </p>
            ) : (
              <div className="space-y-2">
                {orgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {org.slug} · created{" "}
                        {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{org._count.events} events</span>
                      <span>{org._count.members} members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
