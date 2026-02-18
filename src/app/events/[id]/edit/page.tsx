"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Location = { venue?: string; address?: string; city?: string; country?: string };

type Section = {
  id: string;
  title: string;
  content: string;
  type: string;
  sortOrder: number;
  isVisible: boolean;
  _dirty?: boolean;
  _new?: boolean;
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    coverImage: null as string | null,
    primaryColor: "#7c3aed",
    accentColor: "#6366f1",
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Load event data
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
        const branding = (e.brandingSettings || {}) as Record<string, string>;
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
          coverImage: e.coverImage ?? null,
          primaryColor: branding.primaryColor || "#7c3aed",
          accentColor: branding.accentColor || "#6366f1",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setFetching(false));
  }, [eventId]);

  // Load sections
  useEffect(() => {
    fetch(`/api/events/${eventId}/sections`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.sections) setSections(data.sections);
      })
      .catch(() => {});
  }, [eventId]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name")
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, coverImage: reader.result as string }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // ── Section helpers ──
  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: "",
        content: "",
        type: "custom",
        sortOrder: prev.length,
        isVisible: true,
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const updateSection = (idx: number, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch, _dirty: true } : s))
    );
  };

  const removeSection = async (idx: number) => {
    const section = sections[idx];
    if (!section._new) {
      await fetch(`/api/events/${eventId}/sections`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sectionId: section.id }),
      });
    }
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((s, i) => ({ ...s, sortOrder: i, _dirty: true }));
    });
  };

  const saveSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      for (const section of sections) {
        if (!section._dirty) continue;
        if (!section.title.trim()) continue;
        if (section._new) {
          const res = await fetch(`/api/events/${eventId}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: section.title,
              content: section.content,
              type: section.type,
              sortOrder: section.sortOrder,
              isVisible: section.isVisible,
            }),
          });
          if (!res.ok) throw new Error("Failed to create section");
        } else {
          const res = await fetch(`/api/events/${eventId}/sections`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              sectionId: section.id,
              title: section.title,
              content: section.content,
              type: section.type,
              sortOrder: section.sortOrder,
              isVisible: section.isVisible,
            }),
          });
          if (!res.ok) throw new Error("Failed to update section");
        }
      }
      // Reload fresh data
      const res = await fetch(`/api/events/${eventId}/sections`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.sections) setSections(data.sections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sections");
    } finally {
      setSectionsLoading(false);
    }
  }, [sections, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Save sections first
      const dirtySections = sections.some((s) => s._dirty);
      if (dirtySections) await saveSections();

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
          coverImage: formData.coverImage,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          timezone: formData.timezone,
          capacity: parseInt(formData.capacity) || 0,
          visibility: formData.visibility,
          status: formData.status,
          location,
          brandingSettings: {
            badgeTemplate: formData.badgeTemplate,
            primaryColor: formData.primaryColor,
            accentColor: formData.accentColor,
          },
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

  if (fetching) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="flex-1 min-h-0 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-md text-center">
          <p className="text-destructive">{error}</p>
          <Button asChild className="mt-4 rounded-lg" size="sm">
            <Link href={`/events/${eventId}`}>Back to event</Link>
          </Button>
        </div>
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
          <span className="truncate font-medium text-foreground">Edit</span>
        </nav>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Edit event</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update event details, branding, and content</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Basic information ── */}
          <Card>
            <CardHeader className="pb-2 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Basic information</CardTitle>
              <CardDescription>Name, slug, description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:px-6 sm:pb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Event name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug *</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} disabled={loading} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select id="visibility" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.visibility} onChange={(e) => handleChange("visibility", e.target.value)} disabled={loading}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.status} onChange={(e) => handleChange("status", e.target.value)} disabled={loading}>
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

          {/* ── Date & time ── */}
          <Card>
            <CardHeader>
              <CardTitle>Date & time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start *</Label>
                  <Input id="startDate" type="datetime-local" value={formData.startDate} onChange={(e) => handleChange("startDate", e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End *</Label>
                  <Input id="endDate" type="datetime-local" value={formData.endDate} onChange={(e) => handleChange("endDate", e.target.value)} required disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={formData.timezone} onChange={(e) => handleChange("timezone", e.target.value)} disabled={loading} />
              </div>
            </CardContent>
          </Card>

          {/* ── Branding ── */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Cover image and colors for the public registration page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Cover image */}
              <div className="space-y-2">
                <Label>Cover image</Label>
                <p className="text-xs text-muted-foreground">Displayed as the hero on your public registration page. Max 2 MB.</p>
                {formData.coverImage ? (
                  <div className="relative overflow-hidden rounded-lg border">
                    <Image
                      src={formData.coverImage}
                      alt="Cover preview"
                      width={800}
                      height={300}
                      className="h-40 w-full object-cover sm:h-52"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, coverImage: null }))}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span>Click to upload cover image</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {formData.coverImage && (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Replace image
                  </Button>
                )}
              </div>

              {/* Colors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input"
                      disabled={loading}
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="accentColor"
                      value={formData.accentColor}
                      onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input"
                      disabled={loading}
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Preview swatch */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="flex items-center gap-3">
                  <div className="h-10 flex-1 rounded-lg" style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.accentColor})` }} />
                  <span className="text-xs text-muted-foreground">Hero gradient</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Badge ── */}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, badgeTemplate: e.target.value as "default" | "minimal" | "compact" }))}
                  disabled={loading}
                >
                  <option value="default">Default (event name, attendee name, ticket type, QR)</option>
                  <option value="compact">Compact (event name, attendee name, QR)</option>
                  <option value="minimal">Minimal (name + QR only, small card)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* ── Location ── */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" value={formData.venue} onChange={(e) => handleChange("venue", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" min="0" value={formData.capacity} onChange={(e) => handleChange("capacity", e.target.value)} disabled={loading} />
                </div>
              </div>
              <Input placeholder="Address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} disabled={loading} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="City" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} disabled={loading} />
                <Input placeholder="Country" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} disabled={loading} />
              </div>
            </CardContent>
          </Card>

          {/* ── Content sections ── */}
          <Card>
            <CardHeader>
              <CardTitle>Content sections</CardTitle>
              <CardDescription>Add custom content blocks (About, FAQ, Sponsors, etc.) visible on the public registration page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground">No content sections yet. Add one to enrich your event page.</p>
              )}

              {sections.map((section, idx) => (
                <div key={section.id} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Section title"
                        value={section.title}
                        onChange={(e) => updateSection(idx, { title: e.target.value })}
                      />
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={section.type}
                        onChange={(e) => updateSection(idx, { type: e.target.value })}
                      >
                        <option value="about">About</option>
                        <option value="faq">FAQ</option>
                        <option value="sponsors">Sponsors</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => updateSection(idx, { isVisible: !section.isVisible })} className="rounded p-1 text-muted-foreground hover:bg-muted" title={section.isVisible ? "Hide section" : "Show section"}>
                        {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => removeSection(idx)} className="rounded p-1 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Section content... (plain text)"
                    value={section.content}
                    onChange={(e) => updateSection(idx, { content: e.target.value })}
                    rows={4}
                  />
                  {!section.isVisible && (
                    <p className="text-xs text-amber-600">This section is hidden from the public page.</p>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addSection} className="w-full sm:w-auto">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add section
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
            <Button type="submit" disabled={loading || sectionsLoading} className="rounded-lg sm:order-2">
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="rounded-lg">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
