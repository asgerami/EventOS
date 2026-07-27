import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { HeroHeadline } from "@/components/landing/hero-headline";

/* ─── Content ───────────────────────────────────────────────────────────── */

const NAV = [
  { href: "#registration", label: "Registration" },
  { href: "#check-in", label: "Check-in" },
  { href: "#analytics", label: "Analytics" },
  { href: "#teams", label: "Teams" },
];

/* Honest facts about how the product is built — not invented customer metrics
   dressed up as social proof. */
const FACTS: { figure: string; title: string; body: string }[] = [
  {
    figure: "0",
    title: "accounts for attendees",
    body: "They fill in a form and get a ticket by email. No password, no app, no portal to forget.",
  },
  {
    figure: "1",
    title: "record for the whole event",
    body: "Registration, the door and the reports read and write the same rows. Nothing to reconcile afterwards.",
  },
  {
    figure: "4",
    title: "roles, scoped tightly",
    body: "Owner, admin, staff and scanner. A volunteer on the door sees the door and nothing else.",
  },
];

const REGISTRATION_FIELDS: { label: string; value: string; note?: string }[] = [
  { label: "Full name", value: "Amina Rahman" },
  { label: "Email", value: "amina@northlight.co", note: "ticket sent here" },
  { label: "Ticket type", value: "Full conference — £180", note: "12 left" },
];

const REGISTRATION_SESSIONS = [
  { name: "Opening keynote", picked: true },
  { name: "Research ops workshop", picked: true },
  { name: "Evening social", picked: false },
];

const DOOR_LIST: { name: string; ticket: string; at: string | null }[] = [
  { name: "Priya Nandakumar", ticket: "Full conference", at: "09:02" },
  { name: "Tom Okafor", ticket: "Day pass", at: "09:04" },
  { name: "Lena Fischer", ticket: "Speaker", at: null },
];

const SESSION_FILL: { name: string; booked: number; capacity: number }[] = [
  { name: "Opening keynote", booked: 442, capacity: 480 },
  { name: "Research ops workshop", booked: 58, capacity: 60 },
  { name: "Facilitation workshop", booked: 31, capacity: 60 },
  { name: "Evening social", booked: 186, capacity: 320 },
];

const ROLES: { name: string; scope: string }[] = [
  {
    name: "Owner",
    scope: "Everything, including workspace settings, billing details and who else gets in.",
  },
  {
    name: "Admin",
    scope: "Builds and publishes events, sets ticket types, invites the rest of the team.",
  },
  {
    name: "Staff",
    scope: "Reads registrations, works the door, exports the lists they need on the day.",
  },
  {
    name: "Scanner",
    scope: "One screen: scan a ticket, get a yes or a no. Nothing else is reachable.",
  },
];

/* ─── Building blocks ───────────────────────────────────────────────────── */

/** The left-hand column of every numbered section. Index, title, lede, points. */
function SectionIntro({
  index,
  eyebrow,
  title,
  titleId,
  lede,
  points,
}: {
  index: string;
  eyebrow: string;
  title: string;
  titleId: string;
  lede: string;
  points: string[];
}) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <span className="index-numeral text-index" aria-hidden="true">
          {index}
        </span>
        <span className="eyebrow">{eyebrow}</span>
      </div>

      <h2 id={titleId} className="display mt-5 text-display-1">
        {title}
      </h2>

      <p className="lede mt-6 max-w-lg text-lede">{lede}</p>

      <ul className="mt-8 max-w-lg divide-y divide-rule border-t border-rule">
        {points.map((point) => (
          <li key={point} className="prose-body py-3.5 text-body">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Caption sitting under an interface preview. */
function Caption({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-small text-ink-muted">{children}</p>;
}

/**
 * The public registration form, drawn honestly at rest — the real thing an
 * attendee sees, not a mockup of a browser showing it.
 */
function RegistrationPreview() {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-rule px-6 py-5 sm:px-8">
        {/* A real URL, set as a URL — tracked-out caps would break it
            mid-word on a narrow column. */}
        <p className="text-small break-words text-ink-muted">
          eventos.app/register/northlight-25
        </p>
        <p className="display-tight mt-1.5 text-display-3">
          Register for the summit
        </p>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-8" aria-hidden="true">
        {REGISTRATION_FIELDS.map((field) => (
          <div key={field.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small font-semibold text-ink">
                {field.label}
              </span>
              {field.note && (
                <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                  {field.note}
                </span>
              )}
            </div>
            <div className="mt-1.5 truncate rounded-md border border-rule-strong bg-canvas px-3 py-2.5 text-body text-ink-soft">
              {field.value}
            </div>
          </div>
        ))}

        <div>
          <span className="text-small font-semibold text-ink">Sessions</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGISTRATION_SESSIONS.map((session) => (
              <span
                key={session.name}
                className={
                  session.picked
                    ? "rounded-sm border border-[oklch(0.53_0.193_258/35%)] bg-volt-wash px-2.5 py-1 text-small font-semibold text-volt-deep"
                    : "rounded-sm border border-rule-strong px-2.5 py-1 text-small text-ink-muted"
                }
              >
                {session.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-volt px-4 py-3 text-center text-small font-semibold text-white">
          Complete registration
        </div>
      </div>
    </div>
  );
}

/**
 * What the door sees a fifth of a second after a scan: a decision, the person
 * it belongs to, and the running count behind it.
 */
function CheckInPreview() {
  const checkedIn = 312;
  const expected = 480;
  const pct = Math.round((checkedIn / expected) * 100);

  return (
    <div className="surface overflow-hidden">
      {/* The confirmation itself. */}
      <div className="border-b border-rule bg-volt px-6 py-7 text-white sm:px-8">
        <p className="eyebrow text-white/75">Checked in · 09:06</p>
        <p className="font-display mt-2 text-display-2 leading-none font-extrabold tracking-[-0.03em]">
          Amina Rahman
        </p>
        <p className="mt-2 text-small text-white/85">
          Full conference · TKT-8F41-22C9 · first scan
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <p className="figure text-figure">
            {checkedIn.toLocaleString("en-GB")}
            <span className="text-ink-faint">
              {" / "}
              {expected.toLocaleString("en-GB")}
            </span>
          </p>
          <p className="text-small text-ink-muted tabular-nums">
            {pct}% arrived
          </p>
        </div>

        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-canvas-tint"
          role="img"
          aria-label={`${checkedIn} of ${expected} attendees checked in`}
        >
          <div
            className="h-full rounded-full bg-volt"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-6 divide-y divide-rule border-t border-rule">
          {DOOR_LIST.map((person) => (
            <li
              key={person.name}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-body font-medium text-ink">
                  {person.name}
                </span>
                <span className="block truncate text-small text-ink-muted">
                  {person.ticket}
                </span>
              </span>
              <span
                className={
                  person.at
                    ? "shrink-0 text-small font-semibold text-ink tabular-nums"
                    : "shrink-0 text-small text-ink-faint"
                }
              >
                {person.at ?? "Not yet"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Session fill, read live off the same rows the door is writing to. */
function AnalyticsPreview() {
  return (
    <div className="surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow">Session fill</p>
        <p className="text-small text-ink-muted">Northlight Design Summit</p>
      </div>

      <ul className="mt-7 space-y-5">
        {SESSION_FILL.map((session) => {
          const pct = Math.round((session.booked / session.capacity) * 100);
          const tight = pct >= 90;
          return (
            <li key={session.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="min-w-0 text-body font-medium text-ink">
                  {session.name}
                </span>
                <span
                  className={
                    tight
                      ? "shrink-0 text-small font-semibold text-volt tabular-nums"
                      : "shrink-0 text-small text-ink-muted tabular-nums"
                  }
                >
                  {session.booked}/{session.capacity}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas-tint">
                <div
                  className={
                    tight
                      ? "h-full rounded-full bg-volt"
                      : "h-full rounded-full bg-ink-soft"
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-rule pt-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Busiest ten minutes</p>
          <p className="figure mt-2 text-display-2 tabular-nums">08:50</p>
        </div>
        <div>
          <p className="eyebrow">Exports</p>
          <p className="figure mt-2 text-display-2">CSV, PDF</p>
        </div>
      </div>
    </div>
  );
}

/** Roles as a plain list — no wide table to overflow a phone. */
function RolesPreview() {
  return (
    <div className="surface p-6 sm:p-8">
      <p className="eyebrow">Workspace roles</p>
      <ul className="mt-5 divide-y divide-rule border-t border-rule">
        {ROLES.map((role) => (
          <li key={role.name} className="py-4">
            <p className="display-tight text-display-3">{role.name}</p>
            <p className="prose-body mt-1 text-small">{role.scope}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-small text-ink-muted">
        Enforced on the server, on every request — not hidden in the interface.
      </p>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const loggedIn = !!session?.user;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-rule bg-canvas">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Logo size={26} />

          <nav
            aria-label="Sections"
            className="ml-6 hidden items-center gap-7 lg:flex"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link text-small font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {loggedIn ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/events">Your events</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">
                    <span className="sm:hidden">Start</span>
                    <span className="hidden sm:inline">Create a workspace</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ══ Hero — the type is the entire design ══ */}
        <section aria-labelledby="hero-title">
          <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8 lg:pt-24 lg:pb-20">
            <p className="eyebrow">Event operations, end to end</p>

            <HeroHeadline
              id="hero-title"
              className="hero-type mt-6 text-hero"
            >
              <span className="block">Doors open</span>
              <span className="block">at nine.</span>
              <span className="block text-volt">Nobody waits.</span>
            </HeroHeadline>
          </div>

          <div className="border-y border-rule">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-12">
              <div className="lg:col-span-7">
                <p className="lede max-w-xl text-lede">
                  EventOS runs registration, ticketing, QR check-in, attendance
                  and analytics off one shared record — so the day runs on
                  something better than a group chat and three spreadsheets.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="flex flex-wrap items-center gap-3">
                  {loggedIn ? (
                    <>
                      <Button asChild size="lg">
                        <Link href="/events">Your events</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/dashboard">Go to dashboard</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="lg">
                        <Link href="/sign-up">Create a workspace</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/sign-in">Sign in</Link>
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-5 max-w-sm text-small text-ink-muted">
                  Attendees never make an account. Your team keeps working when
                  the venue wifi gives out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Facts ══ */}
        <section
          aria-label="How EventOS is built"
          className="border-b border-rule bg-canvas-sunk"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 md:gap-12 lg:py-16">
            {FACTS.map((fact, i) => (
              <Reveal key={fact.figure} delay={i * 80}>
                <p className="figure text-figure text-volt">{fact.figure}</p>
                <p className="display-tight mt-4 text-display-3">
                  {fact.title}
                </p>
                <p className="prose-body mt-2 text-small">{fact.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 01 · Registration ══ */}
        <section
          id="registration"
          aria-labelledby="registration-title"
          className="border-b border-rule"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:col-span-6">
              <SectionIntro
                index="01"
                eyebrow="Registration"
                titleId="registration-title"
                title="Take the sign-up, send the ticket, move on"
                lede="Each event gets its own hosted form. Capacity is checked at the moment someone submits, the ticket goes out by email straight away, and nobody has to create an account to attend."
                points={[
                  "Capacity is enforced when the row is written, not when the page loads — two people cannot take the last seat.",
                  "Attendees pick their sessions during sign-up, so the fill numbers are real from day one.",
                  "Ticket types, prices and limits stay yours to change up to the moment doors open.",
                ]}
              />
            </div>
            <div className="lg:col-span-6">
              <Reveal>
                <RegistrationPreview />
              </Reveal>
              <Caption>
                The public form. One link, no login, works on a phone.
              </Caption>
            </div>
          </div>
        </section>

        {/* ══ 02 · Check-in ══ */}
        <section
          id="check-in"
          aria-labelledby="check-in-title"
          className="border-b border-rule bg-canvas-sunk"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:order-2 lg:col-span-6">
              <SectionIntro
                index="02"
                eyebrow="Check-in"
                titleId="check-in-title"
                title="The queue is the one thing nobody forgives"
                lede="Scan with the camera your team already has in their pocket. Type the reference when a badge is creased. Keep going when the building's wifi does not."
                points={[
                  "Scans made offline queue on the device and replay in order the moment the connection returns.",
                  "Every check-in is attributed to a named station, so a disputed entry has an answer.",
                  "A second scan of the same ticket is refused and recorded, rather than quietly counted twice.",
                ]}
              />
            </div>
            <div className="lg:order-1 lg:col-span-6">
              <Reveal>
                <CheckInPreview />
              </Reveal>
              <Caption>
                What a door volunteer sees. Nothing else is reachable from here.
              </Caption>
            </div>
          </div>
        </section>

        {/* ══ Pull quote ══ */}
        <section
          aria-label="Why we built it this way"
          className="border-b border-rule"
        >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
            <Reveal>
              <figure className="max-w-4xl border-l-2 border-volt pl-6 sm:pl-10">
                <blockquote className="pull-quote text-quote">
                  The worst moment at any event is a queue that should not
                  exist. Everything in here is built backwards from that
                  moment.
                </blockquote>
                <figcaption className="eyebrow mt-6">
                  Why EventOS looks the way it does
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ══ 03 · Analytics ══ */}
        <section
          id="analytics"
          aria-labelledby="analytics-title"
          className="border-b border-rule"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:col-span-6">
              <SectionIntro
                index="03"
                eyebrow="Analytics"
                titleId="analytics-title"
                title="Numbers early enough to act on them"
                lede="Fill rates, arrival curves and revenue come straight off the live rows — not a report that rebuilds overnight. You can still move a workshop to a bigger room at half past eight."
                points={[
                  "Per-session fill, so you learn which rooms are wrong while there is still time to change them.",
                  "Arrival timing across the door, to staff the next event properly.",
                  "CSV and PDF exports for the finance team, who will only ever open a spreadsheet.",
                ]}
              />
            </div>
            <div className="lg:col-span-6">
              <Reveal>
                <AnalyticsPreview />
              </Reveal>
              <Caption>
                Read from the same rows the door is writing to, as it writes
                them.
              </Caption>
            </div>
          </div>
        </section>

        {/* ══ 04 · Teams ══ */}
        <section
          id="teams"
          aria-labelledby="teams-title"
          className="border-b border-rule bg-canvas-sunk"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:order-2 lg:col-span-6">
              <SectionIntro
                index="04"
                eyebrow="Teams and workspaces"
                titleId="teams-title"
                title="One deployment, however many organisations"
                lede="Every event, ticket and attendee belongs to a workspace. Invite the people you need for the weekend, give them exactly the access the job requires, and take it back on Monday."
                points={[
                  "Records are scoped per organisation, so two teams on the same install never see each other.",
                  "Invitations go out by email and expire; nobody is sharing one login round the team.",
                  "Permissions are checked on the server for every request, including the API.",
                ]}
              />
            </div>
            <div className="lg:order-1 lg:col-span-6">
              <Reveal>
                <RolesPreview />
              </Reveal>
              <Caption>
                Four roles, deliberately few. Most people only need two of them.
              </Caption>
            </div>
          </div>
        </section>

        {/* ══ Close ══ */}
        <section aria-labelledby="close-title">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="max-w-3xl">
              <span className="rule-accent" aria-hidden="true" />
              <h2 id="close-title" className="display mt-6 text-display-1">
                Set it up this afternoon. Run the door on Saturday.
              </h2>
              <p className="lede mt-6 max-w-xl text-lede">
                Make a workspace, build the event, publish the form, and work
                the day from the same place that reports on it afterwards.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {loggedIn ? (
                  <>
                    <Button asChild size="lg">
                      <Link href="/events">Open EventOS</Link>
                    </Button>
                    <SignOutButton
                      showIcon={false}
                      className="inline-flex h-12 items-center justify-center rounded-md border border-rule-strong bg-canvas-raised px-6 text-base font-semibold text-ink transition-colors hover:border-volt hover:text-volt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt disabled:opacity-50"
                    >
                      Sign out
                    </SignOutButton>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/sign-up">Create a workspace</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
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
      <footer className="border-t border-rule bg-canvas-sunk">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo size={26} />
            <p className="prose-body mt-4 max-w-xs text-small">
              Registration, check-in and attendance for the people who have to
              make the room work on the day.
            </p>
          </div>

          <nav aria-label="Sections">
            <p className="eyebrow">On this page</p>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="nav-link text-small">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Your account">
            <p className="eyebrow">Your account</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/sign-up" className="nav-link text-small">
                  Create a workspace
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="nav-link text-small">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="nav-link text-small">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/events" className="nav-link text-small">
                  Events
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-rule">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-small text-ink-muted sm:px-8">
            <p>EventOS — event operations, end to end.</p>
            <p>Built for people who run rooms.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
