import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name ?? session.user.email}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </header>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Host dashboard, organizations, and events will go here.</p>
        <p className="mt-2 text-sm">
          Auth and multi-tenant isolation are in progress.
        </p>
      </div>
    </div>
  );
}
