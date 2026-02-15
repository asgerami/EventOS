import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createRegistrationSchema } from "@/lib/validations/registration";
import { ZodError } from "zod";
import { randomBytes } from "crypto";

/**
 * GET /api/events/[id]/registrations
 * List registrations for an event (tenant-scoped)
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const where = status ? { eventId, status: status as any } : { eventId };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { registeredAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          ticketType: { select: { id: true, name: true, price: true, currency: true } },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return NextResponse.json({
      registrations,
      pagination: { total, limit, offset, hasMore: offset + registrations.length < total },
    });
  }
);

/**
 * POST /api/events/[id]/registrations
 * Create a registration (attendee)
 */
export const POST = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId } = (await params) as { id: string };
      const body = await request.json();

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
        include: { ticketTypes: true },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const data = createRegistrationSchema.parse(body);

      const ticketType = event.ticketTypes.find((t) => t.id === data.ticketTypeId);
      if (!ticketType) {
        return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
      }
      if (ticketType.sold >= ticketType.quantity) {
        return NextResponse.json(
          { error: "This ticket type is sold out" },
          { status: 409 }
        );
      }

      const existing = await prisma.registration.findUnique({
        where: {
          eventId_email: { eventId, email: data.email },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A registration with this email already exists for this event" },
          { status: 409 }
        );
      }

      const confirmationToken = randomBytes(32).toString("hex");

      const registration = await prisma.registration.create({
        data: {
          eventId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          ticketTypeId: data.ticketTypeId,
          sessionIds: data.sessionIds,
          channel: data.channel,
          customFieldValues: data.customFieldValues as any,
          confirmationToken,
          status: "PENDING",
        },
        include: {
          ticketType: { select: { id: true, name: true, price: true, currency: true } },
        },
      });

      // Increment sold count for ticket type
      await prisma.ticketType.update({
        where: { id: data.ticketTypeId },
        data: { sold: { increment: 1 } },
      });

      return NextResponse.json(
        {
          registration: {
            ...registration,
            confirmationToken, // Only returned on create; frontend can show or email it
          },
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Failed to create registration:", error);
      return NextResponse.json(
        { error: "Failed to create registration" },
        { status: 500 }
      );
    }
  }
);
