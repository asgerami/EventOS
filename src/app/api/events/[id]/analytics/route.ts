import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/analytics
 * Real-time analytics: check-in counts, session attendance, capacity.
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        capacity: true,
        sessions: {
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            name: true,
            capacity: true,
            _count: { select: { checkIns: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayCheckIns, totalCheckIns, totalRegistrations] = await Promise.all([
      prisma.checkIn.count({
        where: {
          registration: { eventId },
          type: "CHECKIN",
          scannedAt: { gte: startOfToday },
        },
      }),
      prisma.checkIn.count({
        where: {
          registration: { eventId },
          type: "CHECKIN",
        },
      }),
      prisma.registration.count({ where: { eventId } }),
    ]);

    const sessions = event.sessions.map((s) => ({
      id: s.id,
      name: s.name,
      capacity: s.capacity,
      checkInCount: s._count.checkIns,
    }));

    return NextResponse.json({
      eventName: event.name,
      eventCapacity: event.capacity,
      todayCheckIns,
      totalCheckIns,
      totalRegistrations,
      sessions,
    });
  }
);
