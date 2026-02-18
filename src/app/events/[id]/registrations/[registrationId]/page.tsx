import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getActiveOrganization } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Mail,
  User,
  Ticket,
  CalendarDays,
  ScanLine,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { RegistrationStatusActions } from "../RegistrationStatusActions";
import { CopyTicketLinkButton } from "../CopyTicketLinkButton";

interface PageProps {
  params: Promise<{ id: string; registrationId: string }>;
}

type CustomField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export default async function AttendeeDetailPage({ params }: PageProps) {
  const { id: eventId, registrationId } = await params;
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) redirect("/organizations");

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: organization.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      registrationSettings: true,
      sessions: {
        select: { id: true, name: true, startTime: true, endTime: true, room: true },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!event) redirect("/events");

  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, eventId },
    include: {
      ticketType: { select: { id: true, name: true, price: true, currency: true } },
      checkIns: {
        orderBy: { scannedAt: "desc" },
        include: {
          station: { select: { id: true, name: true, type: true } },
          session: { select: { id: true, name: true, startTime: true, endTime: true, room: true } },
          scanner: { select: { id: true, name: true } },
        },
      },
      badges: {
        orderBy: { printedAt: "desc" },
        select: { id: true, printedAt: true, reason: true },
      },
    },
  });
  if (!registration) redirect(`/events/${eventId}/registrations`);

  const regSettings = (event.registrationSettings || {}) as Record<string, unknown>;
  const approvalRequired = regSettings.approvalRequired === true;
  const customFields = (Array.isArray(regSettings.customFields) ? regSettings.customFields : []) as CustomField[];
  const cfv = (registration.customFieldValues || {}) as Record<string, string>;

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    PENDING: { label: "Pending approval", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10", icon: Clock },
    CONFIRMED: { label: "Confirmed", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    WAITLISTED: { label: "Waitlisted", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/10", icon: Clock },
    CANCELLED: { label: "Cancelled", color: "text-zinc-500", bg: "bg-zinc-500/10", icon: Clock },
    REJECTED: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/10", icon: Clock },
  };
  const sc = statusConfig[registration.status] || statusConfig.CANCELLED;
  const StatusIcon = sc.icon;

  const sessionCheckIns = registration.checkIns.filter((c) => c.sessionId);
  const mainCheckIn = registration.checkIns.find((c) => !c.sessionId);

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Events</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">{event.name}</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link href={`/events/${eventId}/registrations`} className="text-muted-foreground transition-colors hover:text-foreground">Registrations</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium text-foreground">{registration.firstName} {registration.lastName}</span>
        </nav>

        {/* Back link (mobile) */}
        <Link href={`/events/${eventId}/registrations`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:hidden">
          <ArrowLeft className="h-4 w-4" />
          All registrations
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              {registration.firstName} {registration.lastName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{registration.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${sc.bg} ${sc.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {sc.label}
              </span>
              {registration.checkIns.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Checked in
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {approvalRequired && (
              <RegistrationStatusActions eventId={eventId} registrationId={registration.id} currentStatus={registration.status} />
            )}
            <CopyTicketLinkButton eventId={eventId} registrationId={registration.id} className="rounded-lg" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Personal info */}
            <div className="rounded-lg border bg-background">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold">Attendee information</h2>
              </div>
              <div className="divide-y divide-border/60">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Full name</p>
                    <p className="text-sm font-medium">{registration.firstName} {registration.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">{registration.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ticket type</p>
                    <p className="text-sm font-medium">{registration.ticketType.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Registered on</p>
                    <p className="text-sm font-medium">
                      {new Date(registration.registeredAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      {" at "}
                      {new Date(registration.registeredAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {registration.confirmedAt && (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Confirmed on</p>
                      <p className="text-sm font-medium">
                        {new Date(registration.confirmedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs text-muted-foreground">#</span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Channel</p>
                    <p className="text-sm font-medium capitalize">{registration.channel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <div className="rounded-lg border bg-background">
                <div className="border-b px-5 py-4">
                  <h2 className="text-sm font-semibold">Additional information</h2>
                </div>
                <div className="divide-y divide-border/60">
                  {customFields.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs text-muted-foreground">&bull;</span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="text-sm font-medium">
                          {cfv[f.id] || <span className="text-muted-foreground/50">Not provided</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity timeline */}
            <div className="rounded-lg border bg-background">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold">Event activity</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Check-ins, session attendance, and badge prints</p>
              </div>
              {registration.checkIns.length === 0 && registration.badges.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <ScanLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Check-ins and badge prints will appear here.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute bottom-0 left-[29px] top-0 w-px bg-border/60" />
                  <ul className="relative space-y-0 divide-y divide-border/40">
                    {/* Main check-in */}
                    {mainCheckIn && (
                      <li className="flex gap-3 px-5 py-4">
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <ScanLine className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Checked in at event</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Station: {mainCheckIn.station.name} &middot; Method: {mainCheckIn.method}
                            {mainCheckIn.scanner && <> &middot; By: {mainCheckIn.scanner.name}</>}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(mainCheckIn.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                            {new Date(mainCheckIn.scannedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    )}
                    {/* Session check-ins */}
                    {sessionCheckIns.map((ci) => (
                      <li key={ci.id} className="flex gap-3 px-5 py-4">
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                          <CalendarDays className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            Attended: {ci.session?.name || "Unknown session"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {ci.session?.room && <>Room: {ci.session.room} &middot; </>}
                            Station: {ci.station.name} &middot; Method: {ci.method}
                            {ci.scanner && <> &middot; By: {ci.scanner.name}</>}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(ci.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                            {new Date(ci.scannedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                          {ci.session?.startTime && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Session time: {new Date(ci.session.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              {ci.session.endTime && <> – {new Date(ci.session.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                    {/* Badge prints */}
                    {registration.badges.map((b) => (
                      <li key={b.id} className="flex gap-3 px-5 py-4">
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
                          <Printer className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Badge printed</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Reason: {b.reason || "initial"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(b.printedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                            {new Date(b.printedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="rounded-lg border bg-background p-5">
              <h3 className="mb-4 text-sm font-semibold">Quick summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${sc.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Event check-in</span>
                  <span className="text-sm font-medium">
                    {mainCheckIn ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-muted-foreground/50">No</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions attended</span>
                  <span className="text-sm font-medium">{sessionCheckIns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Badges printed</span>
                  <span className="text-sm font-medium">{registration.badges.length}</span>
                </div>
              </div>
            </div>

            {/* Sessions attended summary */}
            {sessionCheckIns.length > 0 && (
              <div className="rounded-lg border bg-background">
                <div className="border-b px-5 py-4">
                  <h3 className="text-sm font-semibold">Sessions attended</h3>
                </div>
                <ul className="divide-y divide-border/60">
                  {sessionCheckIns.map((ci) => (
                    <li key={ci.id} className="px-5 py-3">
                      <p className="text-sm font-medium">{ci.session?.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ci.session?.room && <>{ci.session.room} &middot; </>}
                        {ci.session?.startTime &&
                          new Date(ci.session.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {ci.session?.endTime &&
                          <> – {new Date(ci.session.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Registration ID */}
            <div className="rounded-lg border bg-background p-5">
              <h3 className="mb-2 text-sm font-semibold">Registration ID</h3>
              <p className="break-all font-mono text-xs text-muted-foreground">{registration.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
