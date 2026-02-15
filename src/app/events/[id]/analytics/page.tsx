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
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/events/${eventId}`}>Back to event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-1">
              <Link href={`/events/${eventId}`}>← Back to event</Link>
            </Button>
            <h1 className="text-3xl font-semibold">Live analytics</h1>
            <p className="text-muted-foreground">
              {data?.eventName ?? "…"} · Updates every {POLL_INTERVAL_MS / 1000}s
            </p>
          </div>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </header>

        {data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Check-ins today</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums">
                    {data.todayCheckIns}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums">
                    {data.totalCheckIns}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums">
                    {data.totalRegistrations}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Event capacity</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums">
                    {data.eventCapacity}
                  </span>
                </CardContent>
              </Card>
            </div>

            {data.sessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Session attendance
                  </CardTitle>
                  <CardDescription>
                    Check-ins per session (requires separate session check-in)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {s.checkInCount} checked in
                            {s.capacity != null
                              ? ` · capacity ${s.capacity}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {s.capacity != null && (
                            <span
                              className={`text-sm ${
                                s.checkInCount >= s.capacity
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {Math.round((s.checkInCount / s.capacity) * 100)}% full
                            </span>
                          )}
                          <span className="text-2xl font-bold tabular-nums">
                            {s.checkInCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.sessions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No sessions for this event. Session attendance appears here when
                  you add sessions and use session-specific check-in.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
