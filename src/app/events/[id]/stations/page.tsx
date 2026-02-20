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
import { ChevronRight } from "lucide-react";
import { DeleteItemButton } from "@/components/ui/delete-item-button";

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
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">
            Events
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">
            {event.name}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium text-foreground">Stations</span>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Stations</h1>
            <p className="mt-1 text-sm text-muted-foreground">{event.name}</p>
          </div>
          <Button asChild size="sm" className="w-full rounded-lg sm:w-auto">
            <Link href={`/events/${eventId}/stations/new`}>Add station</Link>
          </Button>
        </header>

        <Card>
          <CardHeader className="pb-2 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Check-in stations</CardTitle>
            <CardDescription>Stations where staff scan tickets and check in attendees</CardDescription>
          </CardHeader>
          <CardContent className="sm:px-6 sm:pb-6">
            {stations.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No stations yet.</p>
                <Button asChild size="sm" className="mt-4 rounded-lg">
                  <Link href={`/events/${eventId}/stations/new`}>Add first station</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {stations.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-sm capitalize text-muted-foreground">
                        {s.type.replace("_", " ")} · {s._count.checkIns} check-ins
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`text-xs font-medium ${s.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                      <DeleteItemButton
                        apiPath={`/api/events/${eventId}/stations/${s.id}`}
                        itemType="station"
                        itemName={s.name}
                        iconOnly
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href={`/events/${eventId}/check-in`}>Open check-in</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link href="/organizations/members">Team & scanners</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
