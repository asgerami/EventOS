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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventStationsPage({ params }: PageProps) {
  const { id: eventId } = await params;
  await requireAuth();
  const organization = await getActiveOrganization();
  const memberRole = await getActiveMemberRole();

  if (!organization) redirect("/organizations");
  if (memberRole === "staff") redirect(`/events/${eventId}/check-in`);

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: organization.id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) redirect("/events");

  const stations = await prisma.station.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    include: { _count: { select: { checkIns: true } } },
  });

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Stations</h1>
          <p className="text-muted-foreground">{event.name}</p>
        </header>

        <div className="mb-6">
          <Button asChild>
            <Link href={`/events/${eventId}/stations/new`}>Add station</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check-in stations</CardTitle>
            <CardDescription>
              Stations where staff can scan tickets and check in attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-4">No stations yet.</p>
                <Button asChild>
                  <Link href={`/events/${eventId}/stations/new`}>Add first station</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stations.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm capitalize text-muted-foreground">
                        {s.type.replace("_", " ")} · {s._count.checkIns} check-ins
                      </p>
                    </div>
                    <span
                      className={`text-xs ${s.isActive ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/events/${eventId}/check-in`}>Open check-in</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/organizations/members">Team & scanners</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
