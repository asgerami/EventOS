import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function EventsPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) {
    redirect("/organizations");
  }

  // Fetch events scoped to this organization only
  const events = await prisma.event.findMany({
    where: { tenantId: organization.id },
    orderBy: { startDate: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/events/new">Create event</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-4 text-muted-foreground">
              No events yet. Create your first event to get started.
            </p>
            <Button asChild>
              <Link href="/events/new">Create your first event</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="hover:border-primary">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {new Date(event.startDate).toLocaleDateString()} •{" "}
                  {event.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
