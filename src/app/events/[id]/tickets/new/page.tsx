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

export default function NewTicketTypePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "0",
    currency: "USD",
    quantity: "100",
    sessionAccess: "all" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          currency: formData.currency,
          quantity: parseInt(formData.quantity) || 1,
          sessionAccess: formData.sessionAccess,
          allowedSessionIds: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket type");
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket type");
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
          <span className="truncate font-medium text-foreground">Add ticket type</span>
        </nav>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Add ticket type</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a ticket type for this event</p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-2 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Ticket details</CardTitle>
              <CardDescription>Name, price, and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:px-6 sm:pb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="General Admission"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.currency}
                    onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (capacity) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                <Button type="submit" disabled={loading} className="rounded-lg">
                  {loading ? "Creating..." : "Create ticket type"}
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
