import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/revenue/export?format=csv
 * Export event revenue by ticket type (tenant-scoped).
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

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
    });

    const headers = ["Ticket type", "Price", "Currency", "Quantity", "Sold", "Revenue"];
    const rows = ticketTypes.map((t) => {
      const priceNum = Number(t.price);
      const revenue = priceNum * t.sold;
      return [t.name, t.price.toString(), t.currency, t.quantity, t.sold, revenue.toFixed(2)];
    });

    const escape = (v: string | number) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n"))
        return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [
      headers.map(escape).join(","),
      ...rows.map((r) => r.map(escape).join(",")),
    ].join("\n");

    const totalRevenue = ticketTypes.reduce((sum, t) => sum + Number(t.price) * t.sold, 0);
    const currency = ticketTypes[0]?.currency ?? "";
    const csvWithTotal = csv + "\n" + ["Total", "", currency, "", "", totalRevenue.toFixed(2)].map(escape).join(",");

    const safeName = event.name.replace(/[^a-z0-9]/gi, "-");
    const filename = `revenue-${safeName}-${eventId.slice(0, 8)}.csv`;

    return new NextResponse(csvWithTotal, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
);
