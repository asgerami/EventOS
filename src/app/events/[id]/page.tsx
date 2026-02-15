import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getActiveOrganization } from "@/lib/auth-utils";
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
  ClipboardList,
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

  if (!organization) redirect("/organizations");

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

  const location = event.location as any;

  const statusClass: Record<string, string> = {
    DRAFT: "status-draft",
    PUBLISHED: "status-published",
    ONGOING: "status-ongoing",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
  };

  const statusGradient: Record<string, string> = {
    DRAFT: "from-zinc-400 to-zinc-500",
    PUBLISHED: "from-blue-500 to-indigo-500",
    ONGOING: "from-emerald-500 to-teal-500",
    COMPLETED: "from-violet-500 to-purple-500",
    CANCELLED: "from-red-500 to-rose-500",
  };

  const totalRevenue = event.ticketTypes.reduce((sum, t) => sum + Number(t.price) * t.sold, 0);

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ── */}
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 rounded-lg">
            <Link href="/events">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to events
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{event.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusClass[event.status] ?? "status-draft"}`}>
                  {event.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
                {location?.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {location.venue ? `${location.venue}, ${location.city}` : location.city}
                  </span>
                )}
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg">
              <Link href={`/events/${event.id}/edit`}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit event
              </Link>
            </Button>
          </div>

          {/* Status bar */}
          <div className={`mt-4 h-1 w-full rounded-full bg-linear-to-r ${statusGradient[event.status] ?? statusGradient.DRAFT}`} />
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Main column ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick stat chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Registrations", value: event._count.registrations, icon: Users, color: "text-violet-500" },
                { label: "Sessions", value: event.sessions.length, icon: Radio, color: "text-blue-500" },
                { label: "Stations", value: event._count.stations, icon: QrCode, color: "text-emerald-500" },
                { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: Ticket, color: "text-amber-500" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="card-hover-glow">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold tracking-tight">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Overview */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">End</p>
                      <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-medium">{event.capacity === 0 ? "Unlimited" : event.capacity}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Timezone</p>
                      <p className="font-medium">{event.timezone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sessions ({event.sessions.length})</CardTitle>
                  <Button asChild size="sm" className="btn-gradient rounded-lg text-xs">
                    <Link href={`/events/${event.id}/sessions/new`}>Add session</Link>
                  </Button>
                </div>
                <CardDescription>Individual tracks and activities</CardDescription>
              </CardHeader>
              <CardContent>
                {event.sessions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {event.sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <Radio className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">{s.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket types */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ticket types ({event.ticketTypes.length})</CardTitle>
                  <Button asChild size="sm" variant="outline" className="rounded-lg text-xs">
                    <Link href={`/events/${event.id}/tickets/new`}>Add ticket type</Link>
                  </Button>
                </div>
                <CardDescription>Registration tiers and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                {event.ticketTypes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No ticket types yet.</p>
                ) : (
                  <div className="space-y-2">
                    {event.ticketTypes.map((ticket) => {
                      const pct = ticket.quantity > 0 ? (ticket.sold / ticket.quantity) * 100 : 0;
                      return (
                        <div key={ticket.id} className="rounded-xl border p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <Ticket className="h-3.5 w-3.5 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{ticket.name}</p>
                                <p className="text-xs text-muted-foreground">{ticket.sold} / {ticket.quantity} sold</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold">{ticket.price.toString()} {ticket.currency}</p>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {/* Revenue total */}
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-medium">Total revenue</span>
                      <span className="text-sm font-bold">{totalRevenue.toFixed(2)} {event.ticketTypes[0]?.currency ?? ""}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Quick actions */}
            <Card className="overflow-hidden">
              <div className="h-1 bg-linear-to-r from-violet-500 to-indigo-500" />
              <CardHeader>
                <CardTitle className="text-base">Registrations & check-in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="btn-gradient w-full rounded-lg text-sm">
                  <Link href={`/events/${event.id}/registrations`}>
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    View registrations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-lg text-sm">
                  <Link href={`/events/${event.id}/stations`}>
                    <QrCode className="mr-1.5 h-3.5 w-3.5" />
                    Stations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-lg text-sm">
                  <Link href={`/events/${event.id}/check-in`}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Check-in station
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-1 bg-linear-to-r from-blue-500 to-cyan-500" />
              <CardHeader>
                <CardTitle className="text-base">Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full rounded-lg text-sm">
                  <Link href={`/events/${event.id}/attendance`}>
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Attendance report
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-lg text-sm">
                  <Link href={`/events/${event.id}/analytics`}>
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    Live analytics
                  </Link>
                </Button>
                {event.ticketTypes.length > 0 && (
                  <Button asChild variant="outline" className="w-full rounded-lg text-sm">
                    <a href={`/api/events/${event.id}/revenue/export?format=csv`} target="_blank" rel="noopener noreferrer" download>
                      <Ticket className="mr-1.5 h-3.5 w-3.5" />
                      Export revenue CSV
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Public registration link */}
            {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
              <Card className="overflow-hidden">
                <div className="h-1 bg-linear-to-r from-emerald-500 to-teal-500" />
                <CardHeader>
                  <CardTitle className="text-base">Public registration</CardTitle>
                  <CardDescription>Share this link with attendees</CardDescription>
                </CardHeader>
                <CardContent>
                  <code className="block break-all rounded-lg bg-muted px-3 py-2 text-xs">/register/{event.id}</code>
                  <Button asChild size="sm" className="btn-gradient mt-3 w-full rounded-lg">
                    <Link href={`/register/${event.id}`} target="_blank" rel="noopener noreferrer">
                      Open page <ExternalLink className="ml-1.5 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <code className="text-xs text-muted-foreground">{event.id.slice(0, 12)}…</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
