"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Sparkles,
  Ticket,
} from "lucide-react";

/* ── Types ── */

type TicketType = {
  id: string;
  name: string;
  price: string;
  currency: string;
  quantity: number;
  sold: number;
  perks: unknown;
};

type Speaker = { name: string; title?: string; bio?: string; photo?: string };

type SessionOption = {
  id: string;
  name: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  track: string | null;
  room: string | null;
  capacity: number | null;
  speakers: Speaker[] | null;
};

type EventSection = {
  id: string;
  title: string;
  content: string;
  type: string;
  sortOrder: number;
};

type EventLocation = {
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
};

type BrandingSettings = {
  primaryColor?: string;
  accentColor?: string;
  badgeTemplate?: string;
};

type EventData = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  location: EventLocation | null;
  status: string;
  capacity: number;
  coverImage: string | null;
  brandingSettings: BrandingSettings | null;
  organization: { name: string; logo: string | null };
  ticketTypes: TicketType[];
  sessions: SessionOption[];
  sections: EventSection[];
  _count: { registrations: number };
};

/* ── Helpers ── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupSessionsByDate(sessions: SessionOption[]) {
  const map = new Map<string, SessionOption[]>();
  for (const s of sessions) {
    const key = new Date(s.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const list = map.get(key) || [];
    list.push(s);
    map.set(key, list);
  }
  return map;
}

/* ── Component ── */

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
  });
  const [success, setSuccess] = useState<{ ticketUrl: string; name: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvent(data.event);
        if (data.event.ticketTypes?.length && !formData.ticketTypeId) {
          setFormData((p) => ({ ...p, ticketTypeId: data.event.ticketTypes[0].id }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Event not found"));
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          sessionIds: [],
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

  // Branding
  const primary = event?.brandingSettings?.primaryColor || "#7c3aed";
  const accent = event?.brandingSettings?.accentColor || "#6366f1";

  const cssVars = useMemo(
    () =>
      ({
        "--ep": primary,
        "--ea": accent,
      }) as React.CSSProperties,
    [primary, accent]
  );

  const location = event?.location as EventLocation | null;
  const locationStr = [location?.venue, location?.city, location?.country].filter(Boolean).join(", ");
  const agendaMap = useMemo(() => (event ? groupSessionsByDate(event.sessions) : new Map()), [event]);

  /* ── Error state ── */
  if (error && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="w-full max-w-sm rounded-2xl border bg-background p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="mb-2 text-lg font-semibold">Event not found</h1>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="w-full rounded-xl">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ ...cssVars, background: `linear-gradient(135deg, color-mix(in srgb, var(--ep) 8%, white), color-mix(in srgb, var(--ea) 6%, white))` }}>
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }}>
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-1 text-2xl font-bold">You&apos;re registered!</h1>
          <p className="mb-6 text-muted-foreground">
            Welcome, {success.name}. Your spot at <span className="font-medium text-foreground">{event?.name}</span> is confirmed.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full rounded-xl text-white" style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }}>
              <a href={success.ticketUrl} target="_blank" rel="noopener noreferrer">
                <Ticket className="mr-2 h-4 w-4" />
                Open my ticket
              </a>
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => navigator.clipboard.writeText(success.ticketUrl)}>
              Copy ticket link
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Powered by <Link href="/" className="font-medium hover:underline">EventOS</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading event...</span>
        </div>
      </div>
    );
  }

  const ticketTypes = event.ticketTypes || [];

  /* ── Main page ── */
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" style={cssVars}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {event.coverImage ? (
          <div className="absolute inset-0">
            <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, color-mix(in srgb, var(--ep) 70%, transparent), color-mix(in srgb, var(--ea) 85%, transparent))` }} />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }} />
        )}
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 text-center text-white sm:px-6 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {event.organization.name}
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">{event.name}</h1>
          {event.description && (
            <p className="mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base lg:text-lg">{event.description}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:scale-105 sm:px-8 sm:py-3.5 sm:text-base"
              style={{ color: primary }}
            >
              Register now
              <ChevronDown className="h-4 w-4" />
            </a>
            {event.sessions.length > 0 && (
              <a href="#agenda" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:px-8 sm:py-3.5 sm:text-base">
                View agenda
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Info bar ── */}
      <section className="border-b bg-background">
        <div className={`mx-auto grid max-w-7xl divide-x divide-border/60 ${locationStr ? "grid-cols-3" : "grid-cols-2"}`}>
          <div className="flex items-center justify-center gap-2.5 px-4 py-4 sm:py-5">
            <CalendarDays className="hidden h-5 w-5 shrink-0 sm:block" style={{ color: primary }} />
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground sm:hidden">Date</p>
              <span className="text-xs font-medium sm:text-sm">{formatDate(event.startDate)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5 px-4 py-4 sm:py-5">
            <Clock className="hidden h-5 w-5 shrink-0 sm:block" style={{ color: primary }} />
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground sm:hidden">Time</p>
              <span className="text-xs font-medium sm:text-sm">{formatTime(event.startDate)} – {formatTime(event.endDate)}</span>
            </div>
          </div>
          {locationStr && (
            <div className="flex items-center justify-center gap-2.5 px-4 py-4 sm:py-5">
              <MapPin className="hidden h-5 w-5 shrink-0 sm:block" style={{ color: primary }} />
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground sm:hidden">Location</p>
                <span className="text-xs font-medium sm:text-sm">{locationStr}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12 xl:gap-16">
          {/* ── Left column: content + agenda ── */}
          <div className="space-y-10 lg:col-span-2">
            {/* Dynamic content sections */}
            {event.sections.map((section) => (
              <div key={section.id}>
                <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{section.title}</h2>
                <div className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">
                  {section.content.split("\n").map((line, i) =>
                    line.trim() ? <p key={i} className="mb-3">{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            ))}

            {/* Agenda */}
            {event.sessions.length > 0 && (
              <div id="agenda">
                <h2 className="mb-6 text-xl font-semibold sm:text-2xl">Agenda</h2>
                <div className="space-y-8">
                  {[...agendaMap.entries()].map(([dateLabel, dateSessions]) => (
                    <div key={dateLabel}>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dateLabel}</h3>
                      <div className="space-y-3">
                        {dateSessions.map((s) => {
                          const speakers = (s.speakers || []) as Speaker[];
                          return (
                            <div key={s.id} className="group rounded-xl border bg-background p-5 transition-shadow hover:shadow-md">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="text-base font-semibold lg:text-lg">{s.name}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                                    {s.room && <> &middot; {s.room}</>}
                                    {s.track && <> &middot; {s.track}</>}
                                  </p>
                                  {s.description && (
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                                  )}
                                </div>
                                <span
                                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                                  style={{ background: `color-mix(in srgb, var(--ep) 12%, transparent)`, color: primary }}
                                >
                                  {s.type}
                                </span>
                              </div>
                              {speakers.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                                  {speakers.map((sp) => (
                                    <div key={sp.name} className="flex items-center gap-2.5">
                                      <div
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                        style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }}
                                      >
                                        {sp.name.charAt(0)}
                                      </div>
                                      <div className="text-sm">
                                        <p className="font-medium">{sp.name}</p>
                                        {sp.title && <p className="text-xs text-muted-foreground">{sp.title}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: registration ── */}
          <div className="lg:col-span-1" id="register">
            <div className="sticky top-6">
              {ticketTypes.length === 0 ? (
                <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                  <div className="px-6 py-8 text-center">
                    <Ticket className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-semibold">Registration unavailable</p>
                    <p className="mt-1 text-sm text-muted-foreground">Check back later for availability.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-background shadow-lg">
                  {/* Card header with branding */}
                  <div className="px-6 pb-5 pt-6 text-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--ep) 8%, transparent), color-mix(in srgb, var(--ea) 6%, transparent))` }}>
                    <div
                      className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full text-white"
                      style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }}
                    >
                      <Ticket className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold">Register for this event</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Fill in your details below to secure your spot.</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium">First name</Label>
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        value={formData.firstName}
                        onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-11 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-11 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    {error && (
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl text-base font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: `linear-gradient(135deg, var(--ep), var(--ea))` }}
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Register now"}
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                      By registering you agree to the event&apos;s terms and conditions.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <Link href="/" className="font-medium hover:underline">EventOS</Link>
        </p>
      </footer>
    </div>
  );
}
