"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

type TicketType = {
  id: string;
  name: string;
  price: string;
  currency: string;
  quantity: number;
  sold: number;
};

type SessionOption = {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  track: string | null;
  room: string | null;
};

type EventData = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  location: unknown;
  status: string;
  ticketTypes: TicketType[];
  sessions?: SessionOption[];
};

export default function PublicRegisterPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    ticketTypeId: "",
    sessionIds: [] as string[],
  });
  const [success, setSuccess] = useState<{ ticketUrl: string; name: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvent(data.event);
        if (data.event.ticketTypes?.length && !formData.ticketTypeId)
          setFormData((p) => ({ ...p, ticketTypeId: data.event.ticketTypes[0].id }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Event not found"));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          ticketTypeId: formData.ticketTypeId,
          sessionIds: formData.sessionIds ?? [],
          channel: "public",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setSuccess({
        ticketUrl: `${base}/ticket/${data.registration.confirmationToken}`,
        name: `${data.registration.firstName} ${data.registration.lastName}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (error && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>You&apos;re registered</CardTitle>
            <CardDescription>
              Hello, {success.name}. Your registration was successful.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Save your ticket link to show the QR code at check-in:
            </p>
            <Button asChild className="w-full">
              <a href={success.ticketUrl} target="_blank" rel="noopener noreferrer">
                Open my ticket
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(success.ticketUrl)}
            >
              Copy ticket link
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/">EventOS</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  const ticketTypes = event.ticketTypes || [];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {new Date(event.startDate).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
            {event.description && (
              <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Enter your details to register for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tickets available at the moment.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    disabled={loading}
                  >
                    {ticketTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.price} {t.currency} ({t.quantity - t.sold} left)
                      </option>
                    ))}
                  </select>
                </div>
                {(event.sessions?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <Label>Sessions (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Select sessions you plan to attend
                    </p>
                    <div className="space-y-2 rounded-md border border-input bg-muted/30 p-3">
                      {event.sessions!.map((s) => {
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
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/">EventOS</Link>
        </p>
      </div>
    </div>
  );
}
