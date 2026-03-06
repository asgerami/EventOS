import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Globe,
  Layers,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";

/* ─── Data ──────────────────────────────────────────── */

const features = [
  {
    title: "Instant Event Setup",
    description:
      "Go from idea to published event in minutes. Configure schedule, sessions, ticket tiers, and branding from a single clean workflow.",
    icon: CalendarDays,
    accent: "from-violet-500/20 to-violet-600/5",
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    span: "md:col-span-2",
  },
  {
    title: "Smart Registration",
    description:
      "Public-facing sign-up with session selection, automatic QR ticket generation, and real-time capacity tracking.",
    icon: Ticket,
    accent: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    span: "",
  },
  {
    title: "Reliable Check-in",
    description:
      "Scan QR codes on any phone, enter codes manually, or deploy dedicated stations. Works offline and syncs automatically.",
    icon: QrCode,
    accent: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    span: "",
  },
  {
    title: "Live Analytics",
    description:
      "Real-time dashboards for attendance, revenue, session fill rates, and check-in velocity. Export CSV and PDF on demand.",
    icon: BarChart3,
    accent: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    span: "md:col-span-2",
  },
];

const steps = [
  {
    num: "01",
    title: "Create workspace",
    detail: "Set up your organization and invite team members.",
    icon: Building2,
  },
  {
    num: "02",
    title: "Build your event",
    detail: "Add sessions, ticket types, branding, and registration page.",
    icon: Layers,
  },
  {
    num: "03",
    title: "Go live",
    detail: "Publish, manage check-in stations, and scan attendees in.",
    icon: Zap,
  },
  {
    num: "04",
    title: "Measure impact",
    detail: "Review analytics, attendance reports, and revenue exports.",
    icon: Sparkles,
  },
];

const audiences = [
  {
    title: "Event Organizers",
    description: "End-to-end lifecycle management for every event you run.",
    points: [
      "Multi-tenant workspace isolation",
      "Draft to completion event lifecycle",
      "Custom badge templates and branding",
    ],
    icon: Building2,
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    title: "Operations & Staff",
    description: "Tools purpose-built for the chaos of event day.",
    points: [
      "Mobile QR scanning with offline mode",
      "Automatic sync queue when back online",
      "Per-session attendance tracking",
    ],
    icon: ShieldCheck,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    title: "Finance & Leadership",
    description: "The numbers you need, exportable and up-to-date.",
    points: [
      "CSV and PDF report generation",
      "Real-time revenue dashboards",
      "Cross-event performance comparison",
    ],
    icon: CreditCard,
    gradient: "from-emerald-600 to-teal-600",
  },
];

const stats = [
  { value: "Real-time", label: "Attendance tracking", icon: BarChart3 },
  { value: "Offline", label: "Check-in support", icon: WifiOff },
  { value: "Multi-tenant", label: "Organization model", icon: Globe },
  { value: "Role-based", label: "Access control", icon: Shield },
];

/* ─── Page ──────────────────────────────────────────── */

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const loggedIn = !!session?.user;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">

      {/* ── Floating gradient blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-blob absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/10" />
        <div className="animate-float-blob-reverse absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10" />
        <div className="animate-float-blob absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-600/5" />
      </div>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-violet-500/25">
              E
            </div>
            <span className="text-lg font-semibold tracking-tight">EventOS</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 md:flex">
            <a href="#features" className="transition hover:text-zinc-900 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-white">How it works</a>
            <a href="#built-for" className="transition hover:text-zinc-900 dark:hover:text-white">Built for</a>
          </nav>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild size="sm" className="bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700">
                  <Link href="/events">Open events</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700">
                  <Link href="/sign-up">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="bg-dot-pattern relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              Built for modern event teams
            </div>

            <h1 className="animate-fade-in-up stagger-1 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              The operating system for{" "}
              <span className="text-gradient">
                unforgettable events
              </span>
            </h1>

            <p className="animate-fade-in-up stagger-2 mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
              Registration, ticketing, QR check-in, attendance, and real-time analytics
              — unified in one platform so your team can focus on what matters.
            </p>

            <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {loggedIn ? (
                <>
                  <Button asChild size="lg" className="h-12 gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-8 text-base text-white shadow-xl shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700">
                    <Link href="/events">
                      Go to events
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base">
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="h-12 gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-8 text-base text-white shadow-xl shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700">
                    <Link href="/sign-up">
                      Create your workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base">
                    <Link href="/sign-in">I have an account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Dashboard preview card ── */}
          <div className="animate-fade-in-up stagger-4 mx-auto mt-16 max-w-4xl">
            <div className="glass-card rounded-2xl p-1 shadow-2xl shadow-zinc-300/40 dark:shadow-black/30">
              <div className="rounded-xl bg-white p-6 dark:bg-zinc-900">
                {/* Fake title bar */}
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-zinc-400 dark:text-zinc-500">EventOS — Live Dashboard</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Stat 1 */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Checked in</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">1,284</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
                      +42 in last 5 min
                    </div>
                  </div>
                  {/* Stat 2 */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenue</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">$42.3K</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div className="h-full w-4/5 rounded-full bg-linear-to-r from-violet-500 to-indigo-500" />
                    </div>
                  </div>
                  {/* Stat 3 */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sessions</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">7</p>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">active tracks running</p>
                  </div>
                </div>

                {/* Mini activity feed */}
                <div className="mt-4 space-y-2">
                  {[
                    { text: "Sarah M. checked in to Keynote", time: "2s ago", color: "bg-emerald-500" },
                    { text: "VIP ticket sold — Workshop Pass", time: "15s ago", color: "bg-violet-500" },
                    { text: "Station 2 synced 8 offline scans", time: "1m ago", color: "bg-blue-500" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                      <span className="flex-1 text-zinc-700 dark:text-zinc-300">{item.text}</span>
                      <span className="text-xs text-zinc-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="border-y border-zinc-200/70 bg-zinc-50/80 dark:border-white/5 dark:bg-white/2">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:py-10">
                  <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{stat.value}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Features bento ── */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Platform capabilities
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your event team needs
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Four core pillars that replace a dozen disconnected tools.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className={`card-hover-glow group relative overflow-hidden ${feature.span}`}>
                  {/* Subtle gradient overlay */}
                  <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <CardHeader className="relative space-y-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="border-y border-zinc-200/70 bg-zinc-50/80 py-20 dark:border-white/5 dark:bg-white/2 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                How it works
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From setup to insights in four steps
              </h2>
            </div>

            <div className="relative grid gap-8 md:grid-cols-4">
              {/* Connector line (desktop) */}
              <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-linear-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700 md:block" />

              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="relative text-center">
                    <div className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-violet-200 bg-white shadow-lg shadow-violet-500/10 dark:border-violet-500/30 dark:bg-zinc-900">
                      <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                      Step {step.num}
                    </span>
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Built for ── */}
        <section id="built-for" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Built for every stakeholder
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One platform, every role covered
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Whether you plan, operate, or report — EventOS adapts to how you work.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {audiences.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="card-hover-glow group relative overflow-hidden">
                  {/* Top gradient bar */}
                  <div className={`h-1 w-full bg-linear-to-r ${item.gradient}`} />
                  <CardHeader className="space-y-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${item.gradient} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {item.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-indigo-600 to-blue-600 p-10 text-white shadow-2xl shadow-violet-500/20 sm:p-14 lg:p-20">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to run your next event with confidence?
                </h2>
                <p className="text-base text-white/80 sm:text-lg">
                  Launch faster, eliminate check-in friction, and give every stakeholder
                  real-time visibility — all from one platform.
                </p>
                <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Team-ready
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <WifiOff className="h-4 w-4" />
                    Offline-safe
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    Insight-driven
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                {loggedIn ? (
                  <>
                    <Button asChild size="lg" className="h-12 rounded-xl bg-white px-8 text-base font-semibold text-violet-700 shadow-xl hover:bg-zinc-100">
                      <Link href="/events">Open EventOS</Link>
                    </Button>
                    <SignOutButton
                      showIcon={false}
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-8 text-base text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      Sign out
                    </SignOutButton>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="h-12 rounded-xl bg-white px-8 text-base font-semibold text-violet-700 shadow-xl hover:bg-zinc-100">
                      <Link href="/sign-up">Create free workspace</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10">
                      <Link href="/sign-in">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200/70 bg-zinc-50 dark:border-white/5 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                E
              </div>
              <span className="text-lg font-semibold tracking-tight">EventOS</span>
            </Link>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              The modern platform for registration, check-in, and event analytics.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Platform</p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="#features" className="transition hover:text-zinc-900 dark:hover:text-white">Features</a></li>
              <li><a href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-white">How it works</a></li>
              <li><a href="#built-for" className="transition hover:text-zinc-900 dark:hover:text-white">Built for</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Product</p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="/sign-up" className="transition hover:text-zinc-900 dark:hover:text-white">Get started</Link></li>
              <li><Link href="/sign-in" className="transition hover:text-zinc-900 dark:hover:text-white">Sign in</Link></li>
              <li><Link href="/dashboard" className="transition hover:text-zinc-900 dark:hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Highlights</p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>QR check-in with offline mode</li>
              <li>Multi-tenant organizations</li>
              <li>Real-time event analytics</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200/70 dark:border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-xs text-zinc-400 sm:px-6 lg:px-8">
            <p>EventOS</p>
            <p>Built for event teams that care about the details.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
