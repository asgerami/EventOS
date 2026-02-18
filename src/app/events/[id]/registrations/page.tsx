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
import { CheckCircle2, ChevronRight } from "lucide-react";
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
        _count: { select: { checkIns: true } },
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
          <span className="truncate font-medium text-foreground">Registrations</span>
        </nav>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">{event.name} · {total} total</p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6">
          <Button asChild size="sm" className="rounded-lg">
            <Link href={`/events/${eventId}/registrations/new`}>Add registration</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <a href={`/api/events/${eventId}/registrations/export?format=csv`} target="_blank" rel="noopener noreferrer" download>
              Export CSV
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <a href={`/api/events/${eventId}/registrations/export?format=pdf`} target="_blank" rel="noopener noreferrer" download>
              Export PDF
            </a>
          </Button>
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <Button asChild variant={!status ? "secondary" : "outline"} size="sm" className="rounded-lg">
              <Link href={`/events/${eventId}/registrations`}>All</Link>
            </Button>
            {(["PENDING", "CONFIRMED", "CANCELLED"] as const).map((s) => (
              <Button key={s} variant={status === s ? "secondary" : "outline"} size="sm" asChild className="rounded-lg">
                <Link href={`/events/${eventId}/registrations?status=${s}`}>{s}</Link>
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Attendees</CardTitle>
            <CardDescription>Registrations for this event</CardDescription>
          </CardHeader>
          <CardContent className="sm:px-6 sm:pb-6">
            {registrations.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No registrations yet.</p>
                <Button asChild size="sm" className="mt-4 rounded-lg">
                  <Link href={`/events/${eventId}/registrations/new`}>Add first registration</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {registrations.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{r.email}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.ticketType.name} · {new Date(r.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r._count.checkIns > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Checked in
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not checked in</span>
                      )}
                      <RegistrationStatusActions eventId={eventId} registrationId={r.id} currentStatus={r.status} />
                      <CopyTicketLinkButton eventId={eventId} registrationId={r.id} />
                      <Badge className={statusColors[r.status] ?? "bg-gray-500"}>{r.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
