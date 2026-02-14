import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, getActiveOrganization } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  // If no active organization, show selection prompt (don't redirect to avoid loops)
  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No organization selected</CardTitle>
            <CardDescription>
              Please select or create an organization to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/organizations">Select organization</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            {organization.name} — {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/organizations">Switch org</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Create and manage your events</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/events">View events</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>Attendee registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/registrations">View registrations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Check-in stats and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/analytics">View analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>
          Multi-tenant isolation is active. All queries are scoped to{" "}
          <strong>{organization.name}</strong>.
        </p>
        <p className="mt-2 text-sm">Next: Event/Session CRUD and API endpoints.</p>
      </div>
    </div>
  );
}
