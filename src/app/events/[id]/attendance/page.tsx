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
import { ChevronRight } from "lucide-react";

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
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">
            Events
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">
            {event.name}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium text-foreground">Attendance</span>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Attendance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.name} — {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full rounded-lg sm:w-auto">
            <a href={`/api/events/${eventId}/attendance?format=csv`} target="_blank" rel="noopener noreferrer" download>
              Export CSV
            </a>
          </Button>
        </header>

        <Card>
          <CardHeader className="pb-2 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Checked-in attendees</CardTitle>
            <CardDescription>Who checked in, when, and at which station</CardDescription>
          </CardHeader>
          <CardContent className="sm:px-6 sm:pb-6">
            {checkIns.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No check-ins yet. Use the check-in station to scan tickets.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto sm:hidden">
                  <ul className="divide-y divide-border/60">
                    {checkIns.map((c) => (
                      <li key={c.id} className="py-4 first:pt-0">
                        <p className="font-medium text-foreground">
                          {c.registration.firstName} {c.registration.lastName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{c.registration.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.registration.ticketType.name} · {c.station.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(c.scannedAt).toLocaleString()} · {c.method}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden overflow-x-auto sm:block">
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
                          <td className="py-3 pr-4">{c.registration.firstName} {c.registration.lastName}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{c.registration.email}</td>
                          <td className="py-3 pr-4">{c.registration.ticketType.name}</td>
                          <td className="py-3 pr-4">{c.station.name} <span className="text-muted-foreground">({c.station.type})</span></td>
                          <td className="py-3 pr-4 text-muted-foreground">{c.session?.name ?? "—"}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{new Date(c.scannedAt).toLocaleString()}</td>
                          <td className="py-3">{c.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
