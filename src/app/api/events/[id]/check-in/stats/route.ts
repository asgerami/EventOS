import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

const SCAN_ALLOWED_ROLES = ["owner", "cohost", "staff"];

/**
 * GET /api/events/[id]/check-in/stats
 * Returns check-in counts for the event. Only organizers and staff can view.
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params, member }) => {
    if (!SCAN_ALLOWED_ROLES.includes(member.role)) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only organizers and staff can view check-in stats." },
        { status: 403 }
      );
    }

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
