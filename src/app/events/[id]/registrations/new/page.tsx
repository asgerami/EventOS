"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

type TicketType = { id: string; name: string; price: string; currency: string; quantity: number; sold: number };

type SessionOption = {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  track: string | null;
  room: string | null;
};

export default function NewRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    ticketTypeId: "",
    sessionIds: [] as string[],
  });

  useEffect(() => {
    fetch(`/api/events/${eventId}/ticket-types`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ticketTypes?.length) {
          setTicketTypes(data.ticketTypes);
          setFormData((p) => ({ ...p, ticketTypeId: data.ticketTypes[0].id }));
        } else if (data.ticketTypes) {
          setTicketTypes(data.ticketTypes);
        }
      })
      .catch(() => setError("Failed to load ticket types"));
  }, [eventId]);

  useEffect(() => {
    fetch(`/api/events/${eventId}/sessions`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions?.length) setSessions(data.sessions);
      })
      .catch(() => {});
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          ticketTypeId: formData.ticketTypeId,
          sessionIds: formData.sessionIds ?? [],
          channel: "walkin",
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create registration");
      router.push(`/events/${eventId}/registrations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
          <span className="text-muted-foreground/60">/</span>
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">Event</Link>
          <span className="text-muted-foreground/60">/</span>
          <Link href={`/events/${eventId}/registrations`} className="truncate text-muted-foreground transition-colors hover:text-foreground">Registrations</Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">Add</span>
        </nav>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Add registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register an attendee for this event</p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-2 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Attendee details</CardTitle>
              <CardDescription>Name and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:px-6 sm:pb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketTypeId">Ticket type *</Label>
                <select
                  id="ticketTypeId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.ticketTypeId}
                  onChange={(e) => setFormData((p) => ({ ...p, ticketTypeId: e.target.value }))}
                  required
                  disabled={loading || ticketTypes.length === 0}
                >
                  {ticketTypes.length === 0 && (
                    <option value="">No ticket types — add one first</option>
                  )}
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.price} {t.currency} ({t.sold}/{t.quantity} sold)
                    </option>
                  ))}
                </select>
              </div>
              {sessions.length > 0 && (
                <div className="space-y-2">
                  <Label>Sessions (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Select sessions this attendee plans to attend
                  </p>
                  <div className="space-y-2 rounded-md border border-input bg-muted/30 p-3">
                    {sessions.map((s) => {
                      const start = new Date(s.startTime);
                      const end = new Date(s.endTime);
                      const timeStr = `${start.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })} – ${end.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`;
                      const checked = formData.sessionIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setFormData((p) => ({
                                ...p,
                                sessionIds: checked
                                  ? p.sessionIds.filter((id) => id !== s.id)
                                  : [...p.sessionIds, s.id],
                              }))
                            }
                            disabled={loading}
                            className="mt-1 rounded border-input"
                          />
                          <span className="text-sm">
                            <span className="font-medium">{s.name}</span>
                            <span className="ml-1 text-muted-foreground">
                              {s.type} · {timeStr}
                              {s.room ? ` · ${s.room}` : ""}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-2">
                <Button type="submit" disabled={loading || ticketTypes.length === 0} className="rounded-lg">
                  {loading ? "Creating..." : "Create registration"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="rounded-lg">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
