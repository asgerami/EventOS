"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Ticket, CheckSquare, CalendarDays } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const POLL_INTERVAL_MS = 5000;

const COLORS = ["#0ea5e9", "#f43f5e", "#10b981", "#8b5cf6", "#f59e0b", "#64748b"];

type SessionStats = {
  id: string;
  name: string;
  capacity: number | null;
  checkInCount: number;
};

type TicketSaleData = {
  id: string;
  name: string;
  sold: number;
  quantity: number;
};

type AnalyticsData = {
  eventName: string;
  eventCapacity: number;
  todayCheckIns: number;
  totalCheckIns: number;
  totalRegistrations: number;
  sessions: SessionStats[];
  ticketSales: TicketSaleData[];
  checkInMethodData: { method: string; count: number }[];
  checkInTimeline: { hour: string; count: number }[];
  registrationTimeline: { date: string; count: number }[];
};

export default function EventAnalyticsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load analytics");
      }
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [eventId]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (error && !data) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="sm:px-6 sm:pb-6">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/events/${eventId}`}>Back to event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        <div>
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">{data?.eventName ?? "Event"}</Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="truncate font-medium text-foreground">Analytics</span>
          </nav>
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Live Analytics</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.eventName ?? "Loading..."} · Updates every {POLL_INTERVAL_MS / 1000}s
              </p>
            </div>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground sm:text-sm font-medium bg-muted px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </header>
        </div>

        {data && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card className="bg-card hover:bg-muted/50 transition-colors shadow-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> Today's Check-ins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums tracking-tight">{data.todayCheckIns}</span>
                </CardContent>
              </Card>
              <Card className="bg-card hover:bg-muted/50 transition-colors shadow-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Total Check-ins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums tracking-tight">{data.totalCheckIns}</span>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {data.totalRegistrations > 0 ? Math.round((data.totalCheckIns / data.totalRegistrations) * 100) : 0}% of registrations
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card hover:bg-muted/50 transition-colors shadow-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-violet-500" /> Registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums tracking-tight">{data.totalRegistrations}</span>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {data.eventCapacity > 0 ? Math.round((data.totalRegistrations / data.eventCapacity) * 100) : 0}% of capacity
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card hover:bg-muted/50 transition-colors shadow-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-500" /> Total Capacity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold tabular-nums tracking-tight">{data.eventCapacity}</span>
                </CardContent>
              </Card>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Timeline Line Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Registration Timeline</CardTitle>
                  <CardDescription>Cumulative registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {data.registrationTimeline && data.registrationTimeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.registrationTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No registration data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Check-ins by Hour Bar Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Check-ins Today</CardTitle>
                  <CardDescription>Hourly check-in activity for the current day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {data.checkInTimeline && data.checkInTimeline.some(t => t.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.checkInTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(':')[0]} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                          <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No check-ins today</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Sales Pie Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Ticket Sales</CardTitle>
                  <CardDescription>Breakdown by ticket type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    {data.ticketSales && data.ticketSales.some(t => t.sold > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.ticketSales.filter(t => t.sold > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="sold"
                            nameKey="name"
                          >
                            {data.ticketSales.filter(t => t.sold > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#111827' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No ticket sales yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Check-in Methods Pie Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Check-in Methods</CardTitle>
                  <CardDescription>How attendees are entering</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    {data.checkInMethodData && data.checkInMethodData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.checkInMethodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="method"
                            label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {data.checkInMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#111827' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No methodology data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Attendance List (Redesigned) */}
            {data.sessions && data.sessions.length > 0 ? (
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-rose-500" />
                    Session Attendance
                  </CardTitle>
                  <CardDescription>Check-ins per session (requires separate session check-in)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.sessions.map((s) => {
                      const capacity = s.capacity || 100;
                      const percentage = s.capacity ? Math.min(100, (s.checkInCount / s.capacity) * 100) : 0;

                      return (
                        <div key={s.id} className="group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors bg-card">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{s.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.checkInCount} {s.checkInCount === 1 ? 'person' : 'people'} checked in
                                {s.capacity != null && ` of ${s.capacity} capacity`}
                              </p>
                            </div>
                            <span className="text-lg font-bold tabular-nums bg-muted px-2.5 py-1 rounded-md">{s.checkInCount}</span>
                          </div>
                          {s.capacity != null && (
                            <div className="space-y-2">
                              <Progress value={percentage} className="h-2" />
                              <div className="flex justify-between items-center text-[11px] font-medium">
                                <span className="text-muted-foreground">{Math.round(percentage)}%</span>
                                <span className={`${percentage >= 90 ? "text-rose-500" : percentage >= 75 ? "text-amber-500" : "text-emerald-500"}`}>
                                  {percentage >= 100 ? "At capacity" : percentage >= 90 ? "Almost full" : "Available"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-border/50 bg-muted/30 border-dashed">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <Activity className="w-10 h-10 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No sessions created</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Session attendance will appear here when you add sessions and enable session-specific check-ins for attendees.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
