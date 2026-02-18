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
      capacity: true,
      coverImage: true,
      brandingSettings: true,
      registrationSettings: true,
      organization: { select: { name: true, logo: true } },
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          sortOrder: true,
        },
      },
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantity: true,
          sold: true,
          perks: true,
        },
      },
      sessions: {
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          startTime: true,
          endTime: true,
          track: true,
          room: true,
          capacity: true,
          speakers: true,
        },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found or not available" }, { status: 404 });
  }

  return NextResponse.json(
    {
      event: {
        ...event,
        ticketTypes: event.ticketTypes.filter((t) => t.sold < t.quantity),
        sessions: event.sessions ?? [],
        sections: event.sections ?? [],
      },
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
