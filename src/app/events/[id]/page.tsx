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
import { Badge } from "@/components/ui/badge";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) {
    redirect("/organizations");
  }

  // Fetch event with tenant isolation
  const event = await prisma.event.findFirst({
    where: {
      id,
      tenantId: organization.id,
      deletedAt: null,
    },
    include: {
      sessions: {
        select: {
          id: true,
          name: true,
          startTime: true,
          endTime: true,
          capacity: true,
          type: true,
        },
        orderBy: { startTime: "asc" },
      },
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantity: true,
          sold: true,
        },
      },
      _count: {
        select: {
          registrations: true,
          stations: true,
        },
      },
    },
  });

  if (!event) {
    redirect("/events");
  }

  const location = event.location as any;
  const statusColors = {
    DRAFT: "bg-gray-500",
    PUBLISHED: "bg-blue-500",
    ONGOING: "bg-green-500",
    COMPLETED: "bg-purple-500",
    CANCELLED: "bg-red-500",
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/events">← Back to events</Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{event.name}</h1>
              <p className="text-muted-foreground">
                {new Date(event.startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[event.status]}>
                {event.status}
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <h3 className="mb-2 font-medium">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-1 text-sm font-medium">Start date</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">End date</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">Timezone</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.timezone}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">Capacity</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.capacity === 0 ? "Unlimited" : event.capacity}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">Visibility</h3>
                    <p className="text-sm capitalize text-muted-foreground">
                      {event.visibility}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">Slug</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.slug}
                    </p>
                  </div>
                </div>

                {location && (
                  <div>
                    <h3 className="mb-2 font-medium">Location</h3>
                    <div className="text-sm text-muted-foreground">
                      {location.venue && <p>{location.venue}</p>}
                      {location.address && <p>{location.address}</p>}
                      {(location.city || location.country) && (
                        <p>
                          {location.city}
                          {location.city && location.country && ", "}
                          {location.country}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sessions ({event.sessions.length})</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/events/${event.id}/sessions/new`}>
                      Add session
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Individual sessions and activities within this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                {event.sessions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No sessions yet. Add your first session to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {event.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h4 className="font-medium">{session.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startTime).toLocaleString()} -{" "}
                            {new Date(session.endTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline">{session.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Types */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Ticket types ({event.ticketTypes.length})
                  </CardTitle>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/events/${event.id}/tickets/new`}>
                      Add ticket type
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Registration ticket types and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {event.ticketTypes.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No ticket types yet. Add ticket types to enable registration.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {event.ticketTypes.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h4 className="font-medium">{ticket.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ticket.sold} / {ticket.quantity} sold
                          </p>
                        </div>
                        <p className="font-medium">
                          {ticket.price.toString()} {ticket.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Registrations
                  </span>
                  <span className="font-medium">
                    {event._count.registrations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Sessions
                  </span>
                  <span className="font-medium">{event.sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Stations
                  </span>
                  <span className="font-medium">{event._count.stations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ticket types
                  </span>
                  <span className="font-medium">
                    {event.ticketTypes.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/events/${event.id}/registrations`}>
                    View registrations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}/check-in`}>
                    Check-in station
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}/edit`}>Edit event</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {new Date(event.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Last updated:</span>{" "}
                  {new Date(event.updatedAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <code className="text-xs">{event.id}</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
