import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateTicketTypeSchema } from "@/lib/validations/ticket-type";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/ticket-types/[ticketId]
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, ticketId } = (await params) as { id: string; ticketId: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ticketType = await prisma.ticketType.findFirst({
      where: { id: ticketId, eventId },
      include: { _count: { select: { registrations: true } } },
    });
    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    return NextResponse.json({ ticketType });
  }
);

/**
 * PUT /api/events/[id]/ticket-types/[ticketId]
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId, ticketId } = (await params) as { id: string; ticketId: string };
      const body = await request.json();

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const existing = await prisma.ticketType.findFirst({
        where: { id: ticketId, eventId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
      }

      const data = updateTicketTypeSchema.parse(body);

      const ticketType = await prisma.ticketType.update({
        where: { id: ticketId },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.price != null && { price: data.price }),
          ...(data.currency != null && { currency: data.currency }),
          ...(data.quantity != null && { quantity: data.quantity }),
          ...(data.sessionAccess != null && { sessionAccess: data.sessionAccess }),
          ...(data.allowedSessionIds != null && { allowedSessionIds: data.allowedSessionIds }),
          ...(data.perks !== undefined && { perks: data.perks as any }),
        },
        include: { _count: { select: { registrations: true } } },
      });

      return NextResponse.json({ ticketType });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Failed to update ticket type:", error);
      return NextResponse.json(
        { error: "Failed to update ticket type" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/events/[id]/ticket-types/[ticketId]
 */
export const DELETE = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, ticketId } = (await params) as { id: string; ticketId: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existing = await prisma.ticketType.findFirst({
      where: { id: ticketId, eventId },
      include: { _count: { select: { registrations: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }
    if (existing._count.registrations > 0) {
      return NextResponse.json(
        { error: "Cannot delete ticket type with existing registrations" },
        { status: 409 }
      );
    }

    await prisma.ticketType.delete({ where: { id: ticketId } });
    return NextResponse.json({ message: "Ticket type deleted", deletedId: ticketId });
  }
);
