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

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "conference" as const,
    track: "",
    room: "",
    startTime: "",
    endTime: "",
    capacity: "",
    requiresSeparateCheckin: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          track: formData.track || undefined,
          room: formData.room || undefined,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          requiresSeparateCheckin: formData.requiresSeparateCheckin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
      }

      // Redirect back to event page
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <Link href={`/events/${eventId}`}>← Back to event</Link>
          </Button>
          <h1 className="text-3xl font-semibold">Add new session</h1>
          <p className="text-muted-foreground">
            Create a session or activity within your event
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Session details</CardTitle>
                <CardDescription>
                  Information about this session or activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Session name *</Label>
                  <Input
                    id="name"
                    placeholder="Opening Keynote"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this session..."
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={4}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={formData.type}
                      onChange={(e) => handleChange("type", e.target.value)}
                      disabled={loading}
                    >
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="panel">Panel</option>
                      <option value="keynote">Keynote</option>
                      <option value="networking">Networking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="track">Track</Label>
                    <Input
                      id="track"
                      placeholder="Technology"
                      value={formData.track}
                      onChange={(e) => handleChange("track", e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Input
                      id="room"
                      placeholder="Main Hall"
                      value={formData.room}
                      onChange={(e) => handleChange("room", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timing */}
            <Card>
              <CardHeader>
                <CardTitle>Timing</CardTitle>
                <CardDescription>
                  When will this session take place?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleChange("startTime", e.target.value)
                      }
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End time *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Capacity & settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity (leave empty for unlimited)
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of attendees for this session
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="requiresSeparateCheckin"
                    type="checkbox"
                    checked={formData.requiresSeparateCheckin}
                    onChange={(e) =>
                      handleChange("requiresSeparateCheckin", e.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="requiresSeparateCheckin" className="text-sm font-normal">
                    Requires separate check-in
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable this if attendees need to check in specifically for
                  this session
                </p>
              </CardContent>
            </Card>

            {/* Error display */}
            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create session"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
