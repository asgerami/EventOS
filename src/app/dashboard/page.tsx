import Link from "next/link";
import { requireAuth, getActiveOrganization, isSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();
  const showAdmin = await isSuperAdmin();

  // If no active organization, show selection prompt (don't redirect to avoid loops)
  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No organization selected</CardTitle>
            <CardDescription>
              Please select or create an organization to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/organizations">Select organization</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [eventCount, registrationCount, recentEvents] = await Promise.all([
    prisma.event.count({ where: { tenantId: organization.id, deletedAt: null } }),
    prisma.registration.count({
      where: { event: { tenantId: organization.id, deletedAt: null } },
    }),
    prisma.event.findMany({
      where: { tenantId: organization.id, deletedAt: null },
      orderBy: { startDate: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, startDate: true, _count: { select: { registrations: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            {organization.name} — {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          {showAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Super Admin</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/organizations">Switch org</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
            <CardTitle className="text-3xl">{eventCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="sm">
              <Link href="/events">View events</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total registrations</CardDescription>
            <CardTitle className="text-3xl">{registrationCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="sm" variant="outline">
              <Link href="/events">By event</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organization</CardDescription>
            <CardTitle className="text-lg font-medium">{organization.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="sm" variant="outline">
              <Link href="/organizations">Switch org</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {recentEvents.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
            <CardDescription>Your latest events</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentEvents.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/events/${ev.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                  >
                    <span className="font-medium">{ev.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ev._count.registrations} reg · {ev.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-4 w-full" variant="outline" size="sm">
              <Link href="/events">All events</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>
          All data is scoped to <strong>{organization.name}</strong>.
        </p>
      </div>
    </div>
  );
}
