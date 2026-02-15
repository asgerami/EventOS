import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/attendance
 * List check-ins (attendance) for the event. Optional ?format=csv for CSV export.
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: {
        registration: { eventId },
        type: "CHECKIN",
      },
      orderBy: { scannedAt: "desc" },
      include: {
        registration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            ticketType: { select: { name: true } },
          },
        },
        station: { select: { name: true, type: true } },
        session: { select: { id: true, name: true } },
      },
    });

    if (format === "csv") {
      const headers = [
        "First name",
        "Last name",
        "Email",
        "Ticket type",
        "Station",
        "Session",
        "Checked in at",
        "Method",
      ];
      const rows = checkIns.map((c) => [
        c.registration.firstName,
        c.registration.lastName,
        c.registration.email,
        c.registration.ticketType.name,
        c.station.name,
        c.session?.name ?? "",
        new Date(c.scannedAt).toISOString(),
        c.method,
      ]);
      const escape = (v: string) => {
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n"))
          return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const csv = [
        headers.map(escape).join(","),
        ...rows.map((r) => r.map(escape).join(",")),
      ].join("\n");
      const filename = `attendance-${event.name.replace(/[^a-z0-9]/gi, "-")}-${eventId.slice(0, 8)}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      attendance: checkIns.map((c) => ({
        id: c.id,
        scannedAt: c.scannedAt,
        method: c.method,
        attendee: {
          firstName: c.registration.firstName,
          lastName: c.registration.lastName,
          email: c.registration.email,
          ticketType: c.registration.ticketType.name,
        },
        station: { name: c.station.name, type: c.station.type },
        session: c.session ? { id: c.session.id, name: c.session.name } : null,
      })),
    });
  }
);
