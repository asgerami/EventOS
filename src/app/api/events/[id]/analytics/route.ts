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
        ticketTypes: {
          select: {
            id: true,
            name: true,
            sold: true,
            quantity: true,
          }
        },
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

    const [
      totalCheckIns,
      totalRegistrations,
      checkInMethods,
      todayCheckInsList,
      allRegistrations
    ] = await Promise.all([
      prisma.checkIn.count({
        where: {
          registration: { eventId },
          type: "CHECKIN",
        },
      }),
      prisma.registration.count({ where: { eventId } }),
      prisma.checkIn.groupBy({
        by: ["method"],
        where: { registration: { eventId }, type: "CHECKIN" },
        _count: { method: true },
      }),
      prisma.checkIn.findMany({
        where: {
          registration: { eventId },
          type: "CHECKIN",
          scannedAt: { gte: startOfToday },
        },
        select: { scannedAt: true },
      }),
      prisma.registration.findMany({
        where: { eventId },
        select: { registeredAt: true },
        orderBy: { registeredAt: "asc" },
      }),
    ]);

    const todayCheckIns = todayCheckInsList.length;

    // Process check-ins by hour
    const checkInsByHour = new Array(24).fill(0);
    todayCheckInsList.forEach((ci) => {
      checkInsByHour[ci.scannedAt.getHours()]++;
    });
    const checkInTimeline = checkInsByHour.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
    }));

    // Process registrations timeline (cumulative by day)
    const registrationsByDay: Record<string, number> = {};
    allRegistrations.forEach((r) => {
      const day = r.registeredAt.toISOString().split("T")[0];
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    });

    let cumulativeRegistrations = 0;
    const registrationTimeline = Object.entries(registrationsByDay).map(([date, count]) => {
      cumulativeRegistrations += count;
      return { date, count: cumulativeRegistrations };
    });

    const checkInMethodData = checkInMethods.map((m) => ({
      method: m.method,
      count: m._count.method,
    }));

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
      ticketSales: event.ticketTypes,
      checkInMethodData,
      checkInTimeline,
      registrationTimeline,
    });
  }
);
