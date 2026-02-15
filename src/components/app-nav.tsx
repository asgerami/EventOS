"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Building2, LogOut, Menu } from "lucide-react";

export function AppNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<{ user?: { name?: string; email?: string } } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    authClient.getSession().then(setSession);
  }, []);

  if (!session?.user) return null;

  const navClass = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/")
      ? "font-medium text-foreground"
      : "text-muted-foreground hover:text-foreground";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          EventOS
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard" className={navClass("/dashboard")}>
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/events" className={navClass("/events")}>
              <Calendar className="mr-1.5 h-4 w-4" />
              Events
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/organizations" className={navClass("/organizations")}>
              <Building2 className="mr-1.5 h-4 w-4" />
              Workspace
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:block">
            {session.user.name ?? session.user.email}
          </span>
          <Button asChild variant="ghost" size="sm">
            <a href="/api/auth/sign-out">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-2 text-sm ${navClass("/dashboard")}`}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className={`rounded-md px-3 py-2 text-sm ${navClass("/events")}`}
              onClick={() => setOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/organizations"
              className={`rounded-md px-3 py-2 text-sm ${navClass("/organizations")}`}
              onClick={() => setOpen(false)}
            >
              Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
