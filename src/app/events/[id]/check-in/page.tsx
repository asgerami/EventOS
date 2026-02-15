"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Station = { id: string; name: string; type: string; _count: { checkIns: number } };

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<{ todayCount: number; totalCount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchStats = () => {
    fetch(`/api/events/${eventId}/check-in/stats`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.todayCount !== undefined) setStats({ todayCount: data.todayCount, totalCount: data.totalCount });
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/events/${eventId}/stations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations?.length) {
          setStations(data.stations);
          setStationId((prev) => prev || data.stations[0].id);
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load stations" }));
    fetchStats();
  }, [eventId]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) {
      setMessage({ type: "error", text: "Enter or scan a ticket code" });
      return;
    }
    if (!stationId) {
      setMessage({ type: "error", text: "Select a station first" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: t,
          stationId,
          method: "manual",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Checked in: ${data.attendee?.name ?? "Attendee"}`,
        });
        setToken("");
        fetchStats();
        inputRef.current?.focus();
      } else if (res.status === 409 && data.alreadyCheckedIn) {
        setMessage({
          type: "error",
          text: `Already checked in: ${data.attendee ?? "Attendee"}`,
        });
        setToken("");
      } else {
        setMessage({
          type: "error",
          text: data.error ?? "Check-in failed",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Check-in</h1>
          <p className="text-muted-foreground">
            Scan or enter ticket code to check in attendees
          </p>
          {stats && (
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>{stats.todayCount}</strong> today · <strong>{stats.totalCount}</strong> total
            </p>
          )}
        </header>

        <form onSubmit={handleCheckIn} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Station</CardTitle>
              <CardDescription>Select the check-in station</CardDescription>
            </CardHeader>
            <CardContent>
              {stations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No stations yet.{" "}
                  <Link
                    href={`/events/${eventId}/stations/new`}
                    className="underline"
                  >
                    Add a station
                  </Link>{" "}
                  first.
                </p>
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  disabled={loading}
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type}) — {s._count.checkIns} check-ins
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket code</CardTitle>
              <CardDescription>
                Paste the code from the ticket or scan the QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Code</Label>
                <Input
                  id="token"
                  ref={inputRef}
                  type="text"
                  placeholder="Paste or enter ticket code..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              {message && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    message.type === "success"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || stations.length === 0}
              >
                {loading ? "Checking in..." : "Check in"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
