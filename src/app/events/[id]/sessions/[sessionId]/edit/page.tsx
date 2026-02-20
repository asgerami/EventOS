"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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

// Convert ISO string → "YYYY-MM-DDTHH:mm" for datetime-local input
function toLocalInput(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditSessionPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const sessionId = params.sessionId as string;

    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "conference",
        track: "",
        room: "",
        startTime: "",
        endTime: "",
        capacity: "",
        requiresSeparateCheckin: false,
    });

    // Pre-load session data
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}`);
                if (!res.ok) throw new Error("Session not found");
                const { session } = await res.json();
                setFormData({
                    name: session.name ?? "",
                    description: session.description ?? "",
                    type: session.type ?? "conference",
                    track: session.track ?? "",
                    room: session.room ?? "",
                    startTime: toLocalInput(session.startTime),
                    endTime: toLocalInput(session.endTime),
                    capacity: session.capacity != null ? String(session.capacity) : "",
                    requiresSeparateCheckin: session.requiresSeparateCheckin ?? false,
                });
            } catch (err) {
                setFetchError(err instanceof Error ? err.message : "Failed to load session");
            } finally {
                setFetching(false);
            }
        }
        load();
    }, [eventId, sessionId]);

    const handleChange = (field: string, value: string | boolean) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}`, {
                method: "PUT",
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
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update session");
            router.push(`/events/${eventId}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update session");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-12 text-center">
                <p className="text-sm text-destructive">{fetchError}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0">
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                <nav className="mb-4 flex items-center gap-2 text-sm">
                    <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
                    <span className="text-muted-foreground/60">/</span>
                    <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">Event</Link>
                    <span className="text-muted-foreground/60">/</span>
                    <span className="truncate font-medium text-foreground">Edit session</span>
                </nav>

                <header className="mb-6 sm:mb-8">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Edit session</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Update session details</p>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Details */}
                        <Card>
                            <CardHeader className="pb-2 sm:px-6 sm:pt-6">
                                <CardTitle className="text-base sm:text-lg">Session details</CardTitle>
                                <CardDescription>Information about this session or activity</CardDescription>
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
                                        onChange={(e) => handleChange("description", e.target.value)}
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
                                <CardDescription>When will this session take place?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime">Start time *</Label>
                                        <Input
                                            id="startTime"
                                            type="datetime-local"
                                            value={formData.startTime}
                                            onChange={(e) => handleChange("startTime", e.target.value)}
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
                                    <Label htmlFor="capacity">Capacity (leave empty for unlimited)</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="0"
                                        placeholder="Optional"
                                        value={formData.capacity}
                                        onChange={(e) => handleChange("capacity", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        id="requiresSeparateCheckin"
                                        type="checkbox"
                                        checked={formData.requiresSeparateCheckin}
                                        onChange={(e) => handleChange("requiresSeparateCheckin", e.target.checked)}
                                        disabled={loading}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="requiresSeparateCheckin" className="text-sm font-normal">
                                        Requires separate check-in
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                                className="rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-lg">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    "Save changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
