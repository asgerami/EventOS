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

export default function NewRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    ticketTypeId: "",
  });

  useEffect(() => {
    fetch(`/api/events/${eventId}/ticket-types`)
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
          sessionIds: [],
          channel: "walkin",
        }),
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}/registrations`}>← Back to registrations</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Add registration</h1>
          <p className="text-muted-foreground">Register an attendee for this event</p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Attendee details</CardTitle>
              <CardDescription>Name and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading || ticketTypes.length === 0}>
                  {loading ? "Creating..." : "Create registration"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
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
