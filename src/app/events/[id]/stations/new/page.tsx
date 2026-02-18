"use client";

import { useState } from "react";
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

export default function NewStationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "entrance" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/stations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create station");
      router.push(`/events/${eventId}/stations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create station");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-md px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
          <span className="text-muted-foreground/60">/</span>
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">Event</Link>
          <span className="text-muted-foreground/60">/</span>
          <Link href={`/events/${eventId}/stations`} className="truncate text-muted-foreground transition-colors hover:text-foreground">Stations</Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">Add</span>
        </nav>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Add station</h1>
          <p className="mt-1 text-sm text-muted-foreground">Check-in station for this event</p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-2 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Station details</CardTitle>
              <CardDescription>Name and type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:px-6 sm:pb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Main entrance"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, type: e.target.value as any }))
                  }
                  disabled={loading}
                >
                  <option value="entrance">Entrance</option>
                  <option value="session_room">Session room</option>
                  <option value="vip">VIP</option>
                  <option value="registration_desk">Registration desk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="submit" disabled={loading} className="rounded-lg">
                  {loading ? "Creating..." : "Create station"}
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
