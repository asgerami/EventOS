import Link from "next/link";
import { redirect } from "next/navigation";
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
import { ArrowRight, CalendarDays, MapPin, Plus, Users } from "lucide-react";

export default async function EventsPage() {
  await requireAuth();
  const organization = await getActiveOrganization();
  const memberRole = await getActiveMemberRole();
  const isScanner = memberRole === "staff";

  if (!organization) {
    redirect("/organizations");
  }

  const events = await prisma.event.findMany({
    where: { tenantId: organization.id, deletedAt: null },
    orderBy: { startDate: "desc" },
    take: 40,
    include: { _count: { select: { registrations: true } } },
  });

  const statusClass: Record<string, string> = {
    DRAFT: "status-draft",
    PUBLISHED: "status-published",
    ONGOING: "status-ongoing",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
  };

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Header */}
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Events</h1>
            <p className="text-sm text-muted-foreground">{organization.name}</p>
          </div>
          {!isScanner && (
            <Button asChild className="btn-gradient rounded-xl">
              <Link href="/events/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Create event
              </Link>
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarDays className="h-7 w-7 text-primary" />
              </div>
              <p className="mb-1 text-lg font-medium">No events yet</p>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Create your first event to start managing registrations, check-ins, and analytics.
              </p>
              <Button asChild className="btn-gradient rounded-xl">
                <Link href="/events/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create your first event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const loc = event.location as any;
              return (
                <Link
                  key={event.id}
                  href={isScanner ? `/events/${event.id}/check-in` : `/events/${event.id}`}
                  className="group"
                >
                  <Card className="card-hover-glow h-full transition-colors">
                    {/* Status bar */}
                    <div className={`h-1 rounded-t-lg ${
                      event.status === "ONGOING" ? "bg-linear-to-r from-emerald-500 to-teal-500" :
                      event.status === "PUBLISHED" ? "bg-linear-to-r from-blue-500 to-indigo-500" :
                      event.status === "COMPLETED" ? "bg-linear-to-r from-violet-500 to-purple-500" :
                      event.status === "CANCELLED" ? "bg-linear-to-r from-red-500 to-rose-500" :
                      "bg-linear-to-r from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700"
                    }`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {event.name}
                        </CardTitle>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass[event.status] ?? "status-draft"}`}>
                          {event.status}
                        </span>
                      </div>
                      <CardDescription className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {loc?.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {loc.city}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {event._count.registrations} registrations
                        </span>
                        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View <ArrowRight className="ml-0.5 inline h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
