import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/ticket/[token]
 * Public: look up registration by confirmation token for ticket display.
 * Returns minimal attendee and event info (no sensitive data).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const registration = await prisma.registration.findFirst({
    where: { confirmationToken: token.trim() },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      eventId: true,
      event: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
      ticketType: { select: { name: true } },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({
    registration: {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      status: registration.status,
      eventName: registration.event.name,
      startDate: registration.event.startDate,
      endDate: registration.event.endDate,
      location: registration.event.location,
      ticketTypeName: registration.ticketType.name,
    },
  });
}
