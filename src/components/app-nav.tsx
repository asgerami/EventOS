"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Building2, LogOut, Menu, X } from "lucide-react";

type SessionState = Awaited<ReturnType<typeof authClient.getSession>>;

export function AppNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    authClient.getSession().then(setSession);
  }, []);

  const user = session && "data" in session ? session.data?.user : (session as { user?: { name?: string; email?: string } } | null)?.user;
  if (!user) return null;

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const navLinkClass = (path: string) =>
    isActive(path)
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/organizations", label: "Workspace", icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-violet-500/20">
            E
          </div>
          <span className="text-sm font-semibold tracking-tight">EventOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${navLinkClass(item.href)}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground lg:block">
            {user.name ?? user.email}
          </span>
          <a
            href="/api/auth/sign-out"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:inline-flex"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </a>

          {/* Mobile toggle */}
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/60 sm:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl sm:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${navLinkClass(item.href)}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <a
              href="/api/auth/sign-out"
              className="mt-1 flex items-center gap-2 rounded-lg border-t border-border/40 px-3 py-2 pt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
