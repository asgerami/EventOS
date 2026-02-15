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
import { CopyTicketLinkButton } from "./CopyTicketLinkButton";
import { RegistrationStatusActions } from "./RegistrationStatusActions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function EventRegistrationsPage({ params, searchParams }: PageProps) {
  const { id: eventId } = await params;
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) redirect("/organizations");

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: organization.id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) redirect("/events");

  const status = (await searchParams).status;
  const where = status ? { eventId, status: status as any } : { eventId };

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      take: 100,
      include: {
        ticketType: { select: { id: true, name: true, price: true, currency: true } },
      },
    }),
    prisma.registration.count({ where }),
  ]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    CONFIRMED: "bg-green-500",
    WAITLISTED: "bg-blue-500",
    CANCELLED: "bg-gray-500",
    REJECTED: "bg-red-500",
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Registrations</h1>
          <p className="text-muted-foreground">{event.name}</p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <Link href={`/events/${eventId}/registrations/new`}>Add registration</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/events/${eventId}/registrations/export?format=csv`}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                Export CSV
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/events/${eventId}/registrations/export?format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                Export PDF
              </a>
            </Button>
            <Button asChild variant={!status ? "secondary" : "outline"} size="sm">
              <Link href={`/events/${eventId}/registrations`}>All</Link>
            </Button>
            {(["PENDING", "CONFIRMED", "CANCELLED"] as const).map((s) => (
              <Button
                key={s}
                variant={status === s ? "secondary" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/events/${eventId}/registrations?status=${s}`}>{s}</Link>
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendees</CardTitle>
            <CardDescription>Registrations for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="mb-4">No registrations yet.</p>
                <Button asChild>
                  <Link href={`/events/${eventId}/registrations/new`}>Add first registration</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{r.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.ticketType.name} · {new Date(r.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RegistrationStatusActions
                        eventId={eventId}
                        registrationId={r.id}
                        currentStatus={r.status}
                      />
                      <CopyTicketLinkButton
                        eventId={eventId}
                        registrationId={r.id}
                      />
                      <Badge className={statusColors[r.status] ?? "bg-gray-500"}>
                        {r.status}
                      </Badge>
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
