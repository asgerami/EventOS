import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/public/events/[id]
 * Public: event info and ticket types for registration (published events only).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await context.params;

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      status: { in: ["PUBLISHED", "ONGOING"] },
    },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      timezone: true,
      location: true,
      status: true,
      ticketTypes: {
        where: {},
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantity: true,
          sold: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found or not available" }, { status: 404 });
  }

  return NextResponse.json({
    event: {
      ...event,
      ticketTypes: event.ticketTypes.filter((t) => t.sold < t.quantity),
    },
  });
}
