import Link from "next/link";
import {
  requireAuth,
  getActiveOrganization,
  isSuperAdmin,
  getActiveMemberRole,
} from "@/lib/auth-utils";
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
  ChevronRight,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();
  const showAdmin = await isSuperAdmin();
  const memberRole = await getActiveMemberRole();
  const isScanner = memberRole === "staff";

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
    <div className="flex min-h-screen flex-col bg-background">
      <AppNav />

      <main className="flex-1">
        {/* ── Header: compact on mobile, spacious on desktop ── */}
        <section className="border-b bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
            {/* Mobile header */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight">
                    {session.user.name ? `Hi, ${session.user.name}` : "Dashboard"}
                  </h1>
                  <p className="text-xs text-muted-foreground">{organization.name}</p>
                </div>
                {!isScanner && (
                  <Button asChild size="sm" className="shrink-0 rounded-lg">
                    <Link href="/events/new">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      New event
                    </Link>
                  </Button>
                )}
              </div>
              {!isScanner && (
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg text-xs">
                    <Link href="/organizations/members">
                      <Users className="mr-1 h-3 w-3" />
                      Team
                    </Link>
                  </Button>
                  {showAdmin && (
                    <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg text-xs">
                      <Link href="/admin">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg text-xs">
                    <Link href="/organizations">
                      <Building2 className="mr-1 h-3 w-3" />
                      Workspace
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop header */}
            <div className="hidden sm:flex sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dashboard
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome back{session.user.name ? `, ${session.user.name}` : ""}
                </h1>
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {organization.name}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {!isScanner && (
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href="/organizations/members">
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      Team & scanners
                    </Link>
                  </Button>
                )}
                {showAdmin && !isScanner && (
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href="/admin">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      Admin
                    </Link>
                  </Button>
                )}
                {!isScanner && (
                  <Button asChild size="sm" className="rounded-lg">
                    <Link href="/events/new">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      New event
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
          {/* ── Stats: inline row on mobile, card grid on desktop ── */}
          <div className="mb-4 grid grid-cols-3 divide-x divide-border/60 rounded-lg border bg-background sm:hidden">
            <Link href="/events" className="flex flex-col items-center py-4">
              <span className="text-2xl font-bold tabular-nums">{eventCount}</span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">Events</span>
            </Link>
            <Link href="/events" className="flex flex-col items-center py-4">
              <span className="text-2xl font-bold tabular-nums">{registrationCount}</span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">Registrations</span>
            </Link>
            <Link href="/organizations" className="flex flex-col items-center py-4">
              <span className="text-2xl font-bold tabular-nums">{recentEvents.length}</span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">Recent</span>
            </Link>
          </div>

          <section className="mb-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">Events</CardDescription>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="sm:px-6 sm:pb-6">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{eventCount}</p>
                <Link href="/events" className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline">
                  View all events <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">Registrations</CardDescription>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="sm:px-6 sm:pb-6">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{registrationCount}</p>
                <Link href="/events" className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline">
                  View by event <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">Workspace</CardDescription>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="sm:px-6 sm:pb-6">
                <p className="truncate text-lg font-semibold tracking-tight">{organization.name}</p>
                <Link href="/organizations" className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline">
                  Switch workspace <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* ── Recent events ── */}
          {recentEvents.length > 0 ? (
            <>
              {/* Mobile: borderless list, no card wrapper */}
              <div className="sm:hidden">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Recent events</h2>
                  <Link href="/events" className="text-xs font-medium text-primary">View all</Link>
                </div>
                <ul className="divide-y divide-border/60">
                  {recentEvents.map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={isScanner ? `/events/${ev.id}/check-in` : `/events/${ev.id}`}
                        className="flex items-center gap-3 py-3 active:bg-muted/40"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{ev.name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            <span className="text-border">·</span>
                            {ev._count.registrations} reg
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass[ev.status] ?? "status-draft"}`}>
                          {ev.status}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desktop: card wrapper */}
              <Card className="hidden sm:block">
                <CardHeader className="pb-3 sm:px-6 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent events</CardTitle>
                      <CardDescription>Your latest events in this workspace</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-lg">
                      <Link href="/events">View all</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="sm:px-6 sm:pb-6">
                  <ul className="divide-y divide-border/60">
                    {recentEvents.map((ev) => (
                      <li key={ev.id}>
                        <Link
                          href={`/events/${ev.id}`}
                          className="group flex items-center justify-between gap-3 rounded-xl py-3 px-2 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <CalendarDays className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground group-hover:text-primary">{ev.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-muted-foreground">{ev._count.registrations} reg</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass[ev.status] ?? "status-draft"}`}>
                              {ev.status}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center sm:py-16">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <p className="mb-1 font-medium">No events yet</p>
                <p className="mb-4 text-sm text-muted-foreground">Create your first event to get started.</p>
                <Button asChild className="rounded-lg">
                  <Link href="/events/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create your first event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
