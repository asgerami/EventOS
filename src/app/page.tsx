import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-md flex-col items-center gap-8 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          EventOS
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          Multi-tenant event management: registration, badges, check-in, and analytics.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {session?.user ? (
            <>
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api/auth/sign-out">Sign out</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
