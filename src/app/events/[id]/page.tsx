import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requireAuth,
  getActiveOrganization,
  getActiveMemberRole,
} from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit,
  ExternalLink,
  MapPin,
  QrCode,
  Radio,
  Ticket,
  Users,
} from "lucide-react";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  await requireAuth();
  const organization = await getActiveOrganization();
  const memberRole = await getActiveMemberRole();

  if (!organization) redirect("/organizations");
  if (memberRole === "staff") redirect(`/events/${id}/check-in`);

  const event = await prisma.event.findFirst({
    where: { id, tenantId: organization.id, deletedAt: null },
    include: {
      sessions: {
        select: { id: true, name: true, startTime: true, endTime: true, capacity: true, type: true },
        orderBy: { startTime: "asc" },
      },
      ticketTypes: {
        select: { id: true, name: true, price: true, currency: true, quantity: true, sold: true },
      },
      _count: { select: { registrations: true, stations: true } },
    },
  });

  if (!event) redirect("/events");

  const location = event.location as { venue?: string; address?: string; city?: string; country?: string } | null;
  const locationDisplay = location?.venue
    ? `${location.venue}${location.city ? `, ${location.city}` : ""}`
    : location?.city ?? null;

  const statusConfig: Record<string, { class: string; gradient: string; heroBg: string; label: string }> = {
    DRAFT: { class: "status-draft", gradient: "from-zinc-400 to-zinc-500", heroBg: "from-zinc-400/10 to-zinc-500/10", label: "Draft" },
    PUBLISHED: { class: "status-published", gradient: "from-blue-500 to-indigo-500", heroBg: "from-blue-500/10 to-indigo-500/10", label: "Published" },
    ONGOING: { class: "status-ongoing", gradient: "from-emerald-500 to-teal-500", heroBg: "from-emerald-500/10 to-teal-500/10", label: "Live" },
    COMPLETED: { class: "status-completed", gradient: "from-violet-500 to-purple-500", heroBg: "from-violet-500/10 to-purple-500/10", label: "Completed" },
    CANCELLED: { class: "status-cancelled", gradient: "from-red-500 to-rose-500", heroBg: "from-red-500/10 to-rose-500/10", label: "Cancelled" },
  };
  const status = statusConfig[event.status] ?? statusConfig.DRAFT;
  const totalRevenue = event.ticketTypes.reduce((sum, t) => sum + Number(t.price) * t.sold, 0);
  const currency = event.ticketTypes[0]?.currency ?? "USD";

  return (
    <div className="flex-1 min-h-0">
      {/* ── Hero header ── */}
      <div className={`relative overflow-hidden border-b bg-linear-to-br ${status.heroBg}`}>
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/events"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Events
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            <span className="truncate font-medium text-foreground">{event.name}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {event.name}
                </h1>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${status.class}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary/80" />
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {locationDisplay && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary/80" />
                    {locationDisplay}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg border-border/80 bg-background/80 backdrop-blur">
                <Link href={`/events/${event.id}/edit`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit event
                </Link>
              </Button>
              <Button asChild size="sm" className="btn-gradient rounded-lg">
                <Link href={`/events/${event.id}/check-in`}>
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  Check-in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border/50 sm:grid-cols-4">
          {[
            {
              label: "Registrations",
              value: event._count.registrations,
              icon: Users,
              href: `/events/${event.id}/registrations`,
              color: "text-violet-600 dark:text-violet-400",
            },
            {
              label: "Sessions",
              value: event.sessions.length,
              icon: Radio,
              href: null,
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Stations",
              value: event._count.stations,
              icon: QrCode,
              href: `/events/${event.id}/stations`,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Revenue",
              value: `${currency === "USD" ? "$" : ""}${totalRevenue.toFixed(0)}${currency !== "USD" ? ` ${currency}` : ""}`,
              icon: Ticket,
              href: null,
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="flex items-center gap-4 bg-background px-4 py-5 sm:px-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums tracking-tight">{item.value}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              </div>
            );
            return item.href ? (
              <Link key={item.label} href={item.href} className="block transition-colors hover:bg-muted/50">
                {content}
              </Link>
            ) : (
              <div key={item.label}>{content}</div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column ── */}
          <div className="space-y-8 lg:col-span-2">
            {/* Event details (Overview) */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Event details
              </h2>
              <Card className="overflow-hidden">
                {event.description && (
                  <CardContent className="border-b pt-5 pb-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  </CardContent>
                )}
                <CardContent className="pt-4">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Start</dt>
                        <dd className="mt-0.5 text-sm font-medium">{new Date(event.startDate).toLocaleString()}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">End</dt>
                        <dd className="mt-0.5 text-sm font-medium">{new Date(event.endDate).toLocaleString()}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Capacity</dt>
                        <dd className="mt-0.5 text-sm font-medium">{event.capacity === 0 ? "Unlimited" : event.capacity}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Timezone</dt>
                        <dd className="mt-0.5 text-sm font-medium">{event.timezone}</dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </section>

            {/* Sessions */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessions ({event.sessions.length})
                </h2>
                <Button asChild size="sm" className="btn-gradient rounded-lg text-xs">
                  <Link href={`/events/${event.id}/sessions/new`}>Add session</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {event.sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <Radio className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No sessions yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Add tracks or activities for this event.</p>
                      <Button asChild size="sm" className="btn-gradient mt-4 rounded-lg">
                        <Link href={`/events/${event.id}/sessions/new`}>Add session</Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {event.sessions.map((s) => (
                        <li key={s.id}>
                          <div className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                <Radio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{s.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                              {s.type}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Ticket types & revenue */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Ticket types & revenue
                </h2>
                <Button asChild size="sm" variant="outline" className="rounded-lg text-xs">
                  <Link href={`/events/${event.id}/tickets/new`}>Add ticket type</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {event.ticketTypes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <Ticket className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No ticket types yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Add tiers to enable registration.</p>
                      <Button asChild size="sm" variant="outline" className="mt-4 rounded-lg">
                        <Link href={`/events/${event.id}/tickets/new`}>Add ticket type</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y">
                        {event.ticketTypes.map((ticket) => {
                          const pct = ticket.quantity > 0 ? (ticket.sold / ticket.quantity) * 100 : 0;
                          return (
                            <li key={ticket.id} className="px-4 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                    <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{ticket.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {ticket.sold} / {ticket.quantity} sold
                                    </p>
                                  </div>
                                </div>
                                <p className="shrink-0 text-sm font-semibold">
                                  {ticket.price.toString()} {ticket.currency}
                                </p>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500 transition-all"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">Total revenue</span>
                        <span className="text-lg font-bold tabular-nums">
                          {totalRevenue.toFixed(2)} {currency}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right sidebar ── */}
          <aside className="space-y-6">
            {/* Primary actions */}
            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <div className={`h-1 bg-linear-to-r ${status.gradient}`} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
                <CardDescription>Manage registrations and check-in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="rounded-lg border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                  Add scanners in <Link href="/organizations/members" className="font-medium text-primary underline">Team & scanners</Link>; they sign in and open Check-in here.
                </p>
                <Button asChild className="btn-gradient w-full justify-between rounded-lg">
                  <Link href={`/events/${event.id}/registrations`}>
                    <span className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      View registrations
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-lg" size="default">
                  <Link href={`/events/${event.id}/stations`}>
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Stations
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-lg" size="default">
                  <Link href={`/events/${event.id}/check-in`}>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Check-in station
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reports</CardTitle>
                <CardDescription>Attendance and analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-between rounded-lg" size="default">
                  <Link href={`/events/${event.id}/attendance`}>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Attendance report
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-lg" size="default">
                  <Link href={`/events/${event.id}/analytics`}>
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Live analytics
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                </Button>
                {event.ticketTypes.length > 0 && (
                  <Button asChild variant="outline" className="w-full justify-between rounded-lg" size="default">
                    <a href={`/api/events/${event.id}/revenue/export?format=csv`} target="_blank" rel="noopener noreferrer" download>
                      <span className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Export revenue CSV
                      </span>
                      <ExternalLink className="h-4 w-4 opacity-50" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Public registration */}
            {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
              <Card className="overflow-hidden border-emerald-500/20">
                <div className="h-1 bg-linear-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Public registration</CardTitle>
                  <CardDescription>Share this link with attendees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="block break-all rounded-lg border bg-muted/50 px-3 py-2.5 text-xs font-mono text-muted-foreground">
                    /register/{event.id}
                  </code>
                  <Button asChild size="sm" className="btn-gradient w-full rounded-lg">
                    <Link href={`/register/${event.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open registration page
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
