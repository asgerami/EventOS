import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/registrations/export?format=csv
 * Export event registrations as CSV (tenant-scoped).
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    if (format !== "csv") {
      return NextResponse.json(
        { error: "Unsupported format. Use format=csv" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      orderBy: { registeredAt: "asc" },
      include: {
        ticketType: { select: { name: true } },
      },
    });

    const headers = [
      "First name",
      "Last name",
      "Email",
      "Ticket type",
      "Status",
      "Registered at",
      "Channel",
    ];
    const rows = registrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.ticketType.name,
      r.status,
      new Date(r.registeredAt).toISOString(),
      r.channel,
    ]);

    const escape = (v: string) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n"))
        return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

    const filename = `registrations-${event.name.replace(/[^a-z0-9]/gi, "-")}-${eventId.slice(0, 8)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
);
