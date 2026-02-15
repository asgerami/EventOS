import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/check-in/stats
 * Returns check-in counts for the event (today and total).
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayCount, totalCount] = await Promise.all([
      prisma.checkIn.count({
        where: {
          registration: { eventId },
          scannedAt: { gte: startOfToday },
        },
      }),
      prisma.checkIn.count({
        where: { registration: { eventId } },
      }),
    ]);

    return NextResponse.json({ todayCount, totalCount });
  }
);
