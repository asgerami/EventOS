"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

type SessionStats = {
  id: string;
  name: string;
  capacity: number | null;
  checkInCount: number;
};

type AnalyticsData = {
  eventName: string;
  eventCapacity: number;
  todayCheckIns: number;
  totalCheckIns: number;
  totalRegistrations: number;
  sessions: SessionStats[];
};

export default function EventAnalyticsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load analytics");
      }
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [eventId]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (error && !data) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="sm:px-6 sm:pb-6">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/events/${eventId}`}>Back to event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
          <span className="text-muted-foreground/60">/</span>
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">{data?.eventName ?? "Event"}</Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">Analytics</span>
        </nav>
        <header className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Live analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.eventName ?? "…"} · Updates every {POLL_INTERVAL_MS / 1000}s
            </p>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground sm:text-sm">Last updated {lastUpdated.toLocaleTimeString()}</p>
          )}
        </header>

        {data && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
              <Card>
                <CardHeader className="pb-1 pt-4 sm:px-5 sm:pt-5">
                  <CardDescription className="text-xs sm:text-sm">Check-ins today</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 sm:px-5 sm:pb-5">
                  <span className="text-2xl font-bold tabular-nums sm:text-3xl">{data.todayCheckIns}</span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 sm:px-5 sm:pt-5">
                  <CardDescription className="text-xs sm:text-sm">Total check-ins</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 sm:px-5 sm:pb-5">
                  <span className="text-2xl font-bold tabular-nums sm:text-3xl">{data.totalCheckIns}</span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 sm:px-5 sm:pt-5">
                  <CardDescription className="text-xs sm:text-sm">Registrations</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 sm:px-5 sm:pb-5">
                  <span className="text-2xl font-bold tabular-nums sm:text-3xl">{data.totalRegistrations}</span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 sm:px-5 sm:pt-5">
                  <CardDescription className="text-xs sm:text-sm">Capacity</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 sm:px-5 sm:pb-5">
                  <span className="text-2xl font-bold tabular-nums sm:text-3xl">{data.eventCapacity}</span>
                </CardContent>
              </Card>
            </div>

            {data.sessions.length > 0 && (
              <Card>
                <CardHeader className="pb-2 sm:px-6 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                    Session attendance
                  </CardTitle>
                  <CardDescription>Check-ins per session (requires separate session check-in)</CardDescription>
                </CardHeader>
                <CardContent className="sm:px-6 sm:pb-6">
                  <ul className="divide-y divide-border/60">
                    {data.sessions.map((s) => (
                      <li key={s.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {s.checkInCount} checked in{s.capacity != null ? ` · capacity ${s.capacity}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.capacity != null && (
                            <span className={`text-sm font-medium ${s.checkInCount >= s.capacity ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                              {Math.round((s.checkInCount / s.capacity) * 100)}% full
                            </span>
                          )}
                          <span className="text-xl font-bold tabular-nums sm:text-2xl">{s.checkInCount}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {data.sessions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground sm:px-6">
                  No sessions for this event. Session attendance appears here when you add sessions and use session-specific check-in.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
