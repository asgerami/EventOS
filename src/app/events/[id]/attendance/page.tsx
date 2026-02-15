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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventAttendancePage({ params }: PageProps) {
  const { id: eventId } = await params;
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) redirect("/organizations");

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: organization.id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) redirect("/events");

  const checkIns = await prisma.checkIn.findMany({
    where: {
      registration: { eventId },
      type: "CHECKIN",
    },
    orderBy: { scannedAt: "desc" },
    take: 500,
    include: {
      registration: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          ticketType: { select: { name: true } },
        },
      },
      station: { select: { name: true, type: true } },
      session: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Attendance</h1>
          <p className="text-muted-foreground">
            {event.name} — {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""}
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/events/${eventId}/attendance?format=csv`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              Export CSV
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checked-in attendees</CardTitle>
            <CardDescription>
              Who checked in, when, and at which station. Export for records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No check-ins yet. Use the check-in station to scan tickets.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Email</th>
                      <th className="pb-2 pr-4 font-medium">Ticket</th>
                      <th className="pb-2 pr-4 font-medium">Station</th>
                      <th className="pb-2 pr-4 font-medium">Session</th>
                      <th className="pb-2 pr-4 font-medium">Time</th>
                      <th className="pb-2 font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {c.registration.firstName} {c.registration.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {c.registration.email}
                        </td>
                        <td className="py-3 pr-4">{c.registration.ticketType.name}</td>
                        <td className="py-3 pr-4">
                          {c.station.name}
                          <span className="text-muted-foreground"> ({c.station.type})</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {c.session?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(c.scannedAt).toLocaleString()}
                        </td>
                        <td className="py-3">{c.method}</td>
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
