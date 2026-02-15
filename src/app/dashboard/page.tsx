import Link from "next/link";
import { requireAuth, getActiveOrganization, isSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();
  const showAdmin = await isSuperAdmin();

  /* ── No org selected ── */
  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppNav />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center page-enter">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Choose a workspace</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Your events live inside a workspace. Select one to get started or create your first.
            </p>
            <Button asChild size="lg" className="btn-gradient w-full rounded-xl">
              <Link href="/organizations">
                Select or create workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const [eventCount, registrationCount, recentEvents] = await Promise.all([
    prisma.event.count({ where: { tenantId: organization.id, deletedAt: null } }),
    prisma.registration.count({
      where: { event: { tenantId: organization.id, deletedAt: null } },
    }),
    prisma.event.findMany({
      where: { tenantId: organization.id, deletedAt: null },
      orderBy: { startDate: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const statusClass: Record<string, string> = {
    DRAFT: "status-draft",
    PUBLISHED: "status-published",
    ONGOING: "status-ongoing",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      <div className="flex-1">
        {/* ── Welcome banner ── */}
        <div className="border-b bg-linear-to-r from-violet-600/5 via-indigo-600/5 to-transparent">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Welcome back{session.user.name ? `, ${session.user.name}` : ""}
              </h1>
              <p className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {organization.name}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {showAdmin && (
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link href="/admin">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="btn-gradient rounded-lg">
                <Link href="/events/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New event
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* ── Stat cards ── */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover-glow stat-card-violet">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Events</CardDescription>
                <CalendarDays className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{eventCount}</p>
                <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs text-primary">
                  <Link href="/events">View all events <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover-glow stat-card-blue">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Registrations</CardDescription>
                <Ticket className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{registrationCount}</p>
                <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs text-primary">
                  <Link href="/events">By event <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover-glow stat-card-emerald">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Workspace</CardDescription>
                <Users className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tracking-tight">{organization.name}</p>
                <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs text-primary">
                  <Link href="/organizations">Switch workspace <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Recent events ── */}
          {recentEvents.length > 0 ? (
            <Card className="card-hover-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent events</CardTitle>
                    <CardDescription>Your latest events across this workspace</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href="/events">View all</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">{ev.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{ev._count.registrations} reg</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass[ev.status] ?? "status-draft"}`}>
                          {ev.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <p className="mb-1 font-medium">No events yet</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first event to get started.
                </p>
                <Button asChild className="btn-gradient rounded-xl">
                  <Link href="/events/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create your first event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
