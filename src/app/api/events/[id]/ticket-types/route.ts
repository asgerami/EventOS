import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createTicketTypeSchema } from "@/lib/validations/ticket-type";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/ticket-types
 * List ticket types for an event
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

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json({ ticketTypes });
  }
);

/**
 * POST /api/events/[id]/ticket-types
 * Create a ticket type
 */
export const POST = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId } = (await params) as { id: string };
      const body = await request.json();

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const data = createTicketTypeSchema.parse(body);
      const allowedSessionIds = data.sessionAccess === "specific" ? (data.allowedSessionIds ?? []) : [];

      const ticketType = await prisma.ticketType.create({
        data: {
          eventId,
          name: data.name,
          price: data.price,
          currency: data.currency,
          quantity: data.quantity,
          sessionAccess: data.sessionAccess,
          allowedSessionIds,
          perks: data.perks as any,
        },
        include: {
          _count: { select: { registrations: true } },
        },
      });

      return NextResponse.json({ ticketType }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Failed to create ticket type:", error);
      return NextResponse.json(
        { error: "Failed to create ticket type" },
        { status: 500 }
      );
    }
  }
);
