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
  Globe,
  MapPin,
  Pencil,
  QrCode,
  Radio,
  Ticket,
  Users,
} from "lucide-react";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { DeleteItemButton } from "@/components/ui/delete-item-button";

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
      {/* ── Hero header (mobile-optimized) ── */}
      <div className={`relative overflow-hidden border-b bg-linear-to-br ${status.heroBg}`}>
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          <nav className="mb-3 flex items-center gap-2 text-sm sm:mb-4">
            <Link
              href="/events"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Events
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span className="truncate font-medium text-foreground">{event.name}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {event.name}
                </h1>
                <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:px-3 sm:py-1 sm:text-xs ${status.class}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary/80" />
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {locationDisplay && (
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/80" />
                    <span className="truncate">{locationDisplay}</span>
                  </span>
                )}
              </div>
            </div>
            {/* Full-width stacked buttons on mobile, row on desktop */}
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
              <DeleteEventButton
                eventId={event.id}
                eventName={event.name}
                registrationCount={event._count.registrations}
              />
              <Button asChild variant="outline" size="sm" className="h-11 rounded-xl border-border/80 bg-background/80 backdrop-blur sm:h-9 sm:rounded-lg">
                <Link href={`/events/${event.id}/edit`} className="flex items-center justify-center">
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit event
                </Link>
              </Button>
              <Button asChild size="sm" className="h-11 rounded-xl sm:h-9 sm:rounded-lg btn-gradient">
                <Link href={`/events/${event.id}/check-in`} className="flex items-center justify-center">
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  Check-in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip: horizontal scroll on mobile, grid on desktop ── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-0">
          <div className="flex gap-3 overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-4 sm:gap-px sm:overflow-visible sm:bg-border/50">
            {[
              {
                label: "Reg",
                labelLong: "Registrations",
                value: event._count.registrations,
                icon: Users,
                href: `/events/${event.id}/registrations`,
                color: "text-violet-600 dark:text-violet-400",
              },
              {
                label: "Sessions",
                labelLong: "Sessions",
                value: event.sessions.length,
                icon: Radio,
                href: null,
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                label: "Stations",
                labelLong: "Stations",
                value: event._count.stations,
                icon: QrCode,
                href: `/events/${event.id}/stations`,
                color: "text-teal-600 dark:text-teal-400",
              },
              {
                label: "Revenue",
                labelLong: "Revenue",
                value: `${currency === "USD" ? "$" : ""}${totalRevenue.toFixed(0)}${currency !== "USD" ? ` ${currency}` : ""}`,
                icon: Ticket,
                href: null,
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex min-w-28 items-center gap-3 rounded-xl border bg-background px-4 py-3 sm:min-w-0 sm:rounded-none sm:border-0 sm:py-5 sm:px-6">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-10 sm:w-10 sm:rounded-xl ${item.color}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold tabular-nums tracking-tight sm:text-2xl">{item.value}</p>
                    <p className="text-[11px] font-medium text-muted-foreground sm:text-xs sm:uppercase sm:tracking-wider">
                      <span className="sm:hidden">{item.label}</span>
                      <span className="hidden sm:inline">{item.labelLong}</span>
                    </p>
                  </div>
                </div>
              );
              return item.href ? (
                <Link key={item.label} href={item.href} className="block shrink-0 transition-colors hover:bg-muted/50 sm:shrink">
                  {content}
                </Link>
              ) : (
                <div key={item.label} className="shrink-0 sm:shrink">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content (tighter on mobile) ── */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left column ── */}
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            {/* Event details — single card, list style */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:mb-4 sm:text-sm">
                Event details
              </h2>
              <Card className="overflow-hidden border-0 shadow-sm sm:border">
                {event.description && (
                  <div className="border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  </div>
                )}
                <dl className="divide-y divide-border/60">
                  {[
                    {
                      icon: CalendarDays,
                      label: "Start",
                      value: new Date(event.startDate).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    },
                    {
                      icon: Clock,
                      label: "End",
                      value: new Date(event.endDate).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                    },
                    {
                      icon: Users,
                      label: "Capacity",
                      value: event.capacity === 0 ? "Unlimited" : String(event.capacity),
                      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    },
                    {
                      icon: Globe,
                      label: "Timezone",
                      value: event.timezone.replace(/_/g, " "),
                      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 px-4 py-3.5 sm:px-5 sm:py-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${item.iconBg}`}
                        >
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                            {item.label}
                          </dt>
                          <dd className="mt-0.5 truncate text-sm font-medium text-foreground sm:text-base">
                            {item.value}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </Card>
            </section>

            {/* Sessions */}
            <section>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                  Sessions ({event.sessions.length})
                </h2>
                <Button asChild size="sm" className="btn-gradient rounded-lg text-xs">
                  <Link href={`/events/${event.id}/sessions/new`}>Add session</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {event.sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center sm:py-12">
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
                          <div className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:py-4">
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 sm:h-10 sm:w-10 sm:rounded-xl">
                                <Radio className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{s.name}</p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:px-2.5 sm:py-1 sm:text-[11px]">
                                {s.type}
                              </span>
                              <Link
                                href={`/events/${event.id}/sessions/${s.id}/edit`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Edit session"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <DeleteItemButton
                                apiPath={`/api/events/${event.id}/sessions/${s.id}`}
                                itemType="session"
                                itemName={s.name}
                                iconOnly
                              />
                            </div>
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
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                  Ticket types & revenue
                </h2>
                <Button asChild size="sm" variant="outline" className="rounded-lg text-xs">
                  <Link href={`/events/${event.id}/tickets/new`}>Add ticket type</Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {event.ticketTypes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center sm:py-12">
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
                            <li key={ticket.id} className="px-4 py-3 sm:py-4">
                              <div className="flex items-center justify-between gap-3 sm:gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                    <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="min-w-0">
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
                      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 sm:py-3">
                        <span className="text-xs font-medium text-muted-foreground sm:text-sm">Total revenue</span>
                        <span className="text-base font-bold tabular-nums sm:text-lg">
                          {totalRevenue.toFixed(2)} {currency}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right sidebar — list-style cards, no top color bars */}
          <aside className="space-y-4 sm:space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader className="pb-2 pt-4 sm:pb-3 sm:px-5 sm:pt-5">
                <CardTitle className="text-sm font-semibold sm:text-base">Actions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                  Manage registrations and check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-4 pt-0 sm:px-5 sm:pb-5">
                <p className="mb-3 px-4 text-[11px] text-muted-foreground sm:mb-4 sm:px-0 sm:text-xs">
                  Add scanners in <Link href="/organizations/members" className="font-medium text-primary underline">Team & scanners</Link>; they use Check-in here.
                </p>
                <ul className="divide-y divide-border/60 sm:rounded-lg sm:border sm:border-border/60">
                  <li>
                    <Link
                      href={`/events/${event.id}/registrations`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 sm:h-8 sm:w-8">
                        <ClipboardList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">View registrations</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/events/${event.id}/stations`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 sm:h-8 sm:w-8">
                        <QrCode className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">Stations</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/events/${event.id}/check-in`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 sm:h-8 sm:w-8">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">Check-in station</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card>
              <CardHeader className="pb-2 pt-4 sm:pb-3 sm:px-5 sm:pt-5">
                <CardTitle className="text-sm font-semibold sm:text-base">Reports</CardTitle>
                <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                  Attendance and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-4 pt-0 sm:px-5 sm:pb-5">
                <ul className="divide-y divide-border/60 sm:rounded-lg sm:border sm:border-border/60">
                  <li>
                    <Link
                      href={`/events/${event.id}/attendance`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 sm:h-8 sm:w-8">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">Attendance report</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/events/${event.id}/analytics`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 sm:h-8 sm:w-8">
                        <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">Live analytics</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                  {event.ticketTypes.length > 0 && (
                    <li>
                      <a
                        href={`/api/events/${event.id}/revenue/export?format=csv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:px-4 sm:py-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 sm:h-8 sm:w-8">
                          <Ticket className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="flex-1 font-medium text-foreground">Export revenue CSV</span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Public registration */}
            {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
              <Card>
                <CardHeader className="pb-2 pt-4 sm:pb-3 sm:px-5 sm:pt-5">
                  <CardTitle className="text-sm font-semibold sm:text-base">Public registration</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                    Share this link with attendees
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:py-3">
                    <code className="block break-all text-[11px] font-mono text-muted-foreground sm:text-xs">
                      /register/{event.id}
                    </code>
                  </div>
                  <Link
                    href={`/register/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted/60 sm:mt-4 sm:py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 sm:h-8 sm:w-8">
                      <ExternalLink className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">Open registration page</span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
