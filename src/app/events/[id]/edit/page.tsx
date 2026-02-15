"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Location = { venue?: string; address?: string; city?: string; country?: string };

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    timezone: "UTC",
    capacity: "0",
    visibility: "public" as const,
    status: "DRAFT" as const,
    venue: "",
    address: "",
    city: "",
    country: "",
    badgeTemplate: "default" as "default" | "minimal" | "compact",
  });

  useEffect(() => {
    fetch(`/api/events/${eventId}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load event");
        return data;
      })
      .then((data) => {
        const e = data.event;
        const loc = (e.location || {}) as Location;
        const branding = (e.brandingSettings || {}) as { badgeTemplate?: string };
        setFormData({
          name: e.name ?? "",
          slug: e.slug ?? "",
          description: e.description ?? "",
          startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : "",
          endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : "",
          timezone: e.timezone ?? "UTC",
          capacity: String(e.capacity ?? 0),
          visibility: e.visibility ?? "public",
          status: e.status ?? "DRAFT",
          venue: loc.venue ?? "",
          address: loc.address ?? "",
          city: loc.city ?? "",
          country: loc.country ?? "",
          badgeTemplate: (branding.badgeTemplate === "minimal" || branding.badgeTemplate === "compact" ? branding.badgeTemplate : "default") as "default" | "minimal" | "compact",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setFetching(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const location =
        formData.venue || formData.address || formData.city || formData.country
          ? {
              venue: formData.venue || undefined,
              address: formData.address || undefined,
              city: formData.city || undefined,
              country: formData.country || undefined,
            }
          : undefined;

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || undefined,
          description: formData.description || undefined,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          timezone: formData.timezone,
          capacity: parseInt(formData.capacity) || 0,
          visibility: formData.visibility,
          status: formData.status,
          location,
          brandingSettings: { badgeTemplate: formData.badgeTemplate },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update");
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name")
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      }));
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-md text-center">
          <p className="text-destructive">{error}</p>
          <Button asChild className="mt-4">
            <Link href={`/events/${eventId}`}>Back to event</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Edit event</h1>
          <p className="text-muted-foreground">Update event details</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>Name, slug, description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.visibility}
                    onChange={(e) => handleChange("visibility", e.target.value)}
                    disabled={loading}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    disabled={loading}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date & time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badge</CardTitle>
              <CardDescription>Template used for printed/PDF badges (attendee ticket page)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="badgeTemplate">Badge template</Label>
                <select
                  id="badgeTemplate"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.badgeTemplate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      badgeTemplate: e.target.value as "default" | "minimal" | "compact",
                    }))
                  }
                  disabled={loading}
                >
                  <option value="default">Default (event name, attendee name, ticket type, QR)</option>
                  <option value="compact">Compact (event name, attendee name, QR)</option>
                  <option value="minimal">Minimal (name + QR only, small card)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleChange("venue", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <Input
                placeholder="Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={loading}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
