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
import { Badge } from "@/components/ui/badge";

const USERS_PAGE_SIZE = 50;

export default async function SuperAdminPage() {
  const [orgs, totalEvents, totalMembers, users] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { events: true, members: true },
        },
      },
    }),
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              All users across tenants. Showing latest {USERS_PAGE_SIZE}
              {totalMembers > USERS_PAGE_SIZE
                ? ` of ${totalMembers}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No users yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Email</th>
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Organizations</th>
                      <th className="pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{u.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{u.role}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {u.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <span className="text-muted-foreground">Active</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {u.members.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {u.members
                                .map((m) => `${m.organization.name} (${m.role})`)
                                .join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
