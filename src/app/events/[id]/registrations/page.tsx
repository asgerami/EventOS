import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getActiveOrganization } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronRight,
  Search,
  Download,
  UserPlus,
  Users,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";
import { RegistrationStatusActions } from "./RegistrationStatusActions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}

type CustomField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export default async function EventRegistrationsPage({ params, searchParams }: PageProps) {
  const { id: eventId } = await params;
  const session = await requireAuth();
  const organization = await getActiveOrganization();

  if (!organization) redirect("/organizations");

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: organization.id, deletedAt: null },
    select: { id: true, name: true, registrationSettings: true },
  });
  if (!event) redirect("/events");

  const regSettings = (event.registrationSettings || {}) as Record<string, unknown>;
  const approvalRequired = regSettings.approvalRequired === true;
  const customFields = (Array.isArray(regSettings.customFields) ? regSettings.customFields : []) as CustomField[];

  const sp = await searchParams;
  const status = sp.status;
  const searchQuery = sp.q;

  const where: Record<string, unknown> = { eventId };
  if (status) where.status = status;
  if (searchQuery) {
    where.OR = [
      { firstName: { contains: searchQuery, mode: "insensitive" } },
      { lastName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [registrations, total, statusCounts] = await Promise.all([
    prisma.registration.findMany({
      where: where as any,
      orderBy: { registeredAt: "desc" },
      take: 100,
      include: {
        ticketType: { select: { id: true, name: true, price: true, currency: true } },
        _count: { select: { checkIns: true } },
      },
    }),
    prisma.registration.count({ where: where as any }),
    prisma.registration.groupBy({
      by: ["status"],
      where: { eventId },
      _count: true,
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const s of statusCounts) {
    counts[s.status] = s._count;
  }
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10" },
    CONFIRMED: { label: "Confirmed", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    WAITLISTED: { label: "Waitlisted", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/10" },
    CANCELLED: { label: "Cancelled", color: "text-zinc-500", bg: "bg-zinc-500/10" },
    REJECTED: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/10" },
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">
            Events
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link href={`/events/${eventId}`} className="truncate text-muted-foreground transition-colors hover:text-foreground">
            {event.name}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium text-foreground">Registrations</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Registrations</h1>
            <p className="mt-1 text-sm text-muted-foreground">{event.name} &middot; {totalAll} total</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="rounded-lg">
              <Link href={`/events/${eventId}/registrations/new`}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Add attendee
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <a href={`/api/events/${eventId}/registrations/export?format=csv`} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-1.5 h-4 w-4" />
                Export
              </a>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-lg border bg-background p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="mt-1 text-xl font-bold">{totalAll}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Confirmed</span>
            </div>
            <p className="mt-1 text-xl font-bold">{counts.CONFIRMED || 0}</p>
          </div>
          {approvalRequired && (
            <div className="rounded-lg border bg-background p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Pending</span>
              </div>
              <p className="mt-1 text-xl font-bold">{counts.PENDING || 0}</p>
            </div>
          )}
          <div className="rounded-lg border bg-background p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-medium text-muted-foreground">Cancelled</span>
            </div>
            <p className="mt-1 text-xl font-bold">{counts.CANCELLED || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
            <Button asChild variant={!status ? "secondary" : "ghost"} size="sm" className="h-8 rounded-lg text-xs">
              <Link href={`/events/${eventId}/registrations`}>All ({totalAll})</Link>
            </Button>
            {(["CONFIRMED", ...(approvalRequired ? ["PENDING"] : []), "CANCELLED"] as const).map((s) => (
              <Button key={s} variant={status === s ? "secondary" : "ghost"} size="sm" asChild className="h-8 rounded-lg text-xs">
                <Link href={`/events/${eventId}/registrations?status=${s}`}>
                  {statusConfig[s]?.label || s} ({counts[s] || 0})
                </Link>
              </Button>
            ))}
          </div>
          <form className="relative" action={`/events/${eventId}/registrations`}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              placeholder="Search by name or email..."
              defaultValue={searchQuery || ""}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
            />
          </form>
        </div>

        {/* Table (desktop) */}
        <div className="hidden rounded-lg border bg-background sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Attendee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  {customFields.slice(0, 3).map((f) => (
                    <th key={f.id} className="px-4 py-3 text-left font-medium text-muted-foreground">{f.label}</th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-in</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
                  {approvalRequired && (
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={99} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">No registrations found</p>
                      <p className="mt-1 text-xs">Add attendees or share the public registration link.</p>
                    </td>
                  </tr>
                ) : (
                  registrations.map((r) => {
                    const cfv = (r.customFieldValues || {}) as Record<string, string>;
                    const sc = statusConfig[r.status] || statusConfig.CANCELLED;
                    return (
                      <tr key={r.id} className="group transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/events/${eventId}/registrations/${r.id}`} className="font-medium text-foreground hover:underline">
                            {r.firstName} {r.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                        {customFields.slice(0, 3).map((f) => (
                          <td key={f.id} className="px-4 py-3 text-muted-foreground">
                            {cfv[f.id] || <span className="text-muted-foreground/30">&mdash;</span>}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r._count.checkIns > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(r.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        {approvalRequired && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <RegistrationStatusActions eventId={eventId} registrationId={r.id} currentStatus={r.status} />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {total > 100 && (
            <div className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
              Showing 100 of {total} registrations
            </div>
          )}
        </div>

        {/* Mobile list */}
        <div className="space-y-2 sm:hidden">
          {registrations.length === 0 ? (
            <div className="rounded-lg border bg-background px-4 py-12 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No registrations found</p>
            </div>
          ) : (
            registrations.map((r) => {
              const cfv = (r.customFieldValues || {}) as Record<string, string>;
              const sc = statusConfig[r.status] || statusConfig.CANCELLED;
              return (
                <Link
                  key={r.id}
                  href={`/events/${eventId}/registrations/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30 active:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                    {customFields.slice(0, 2).map((f) =>
                      cfv[f.id] ? (
                        <p key={f.id} className="mt-0.5 truncate text-xs text-muted-foreground">
                          {f.label}: {cfv[f.id]}
                        </p>
                      ) : null
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      {r._count.checkIns > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Checked in
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
