import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/validations/session";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/sessions
 * List all sessions for an event
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    // Verify event exists and belongs to tenant
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const sessions = await prisma.eventSession.findMany({
      where: { eventId },
      orderBy: { startTime: "asc" },
      include: {
        _count: {
          select: {
            checkIns: true,
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  }
);

/**
 * POST /api/events/[id]/sessions
 * Create a new session for an event
 */
export const POST = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId } = (await params) as { id: string };
      const body = await request.json();

      // Verify event exists and belongs to tenant
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      // Validate input
      const validatedData = createSessionSchema.parse(body);

      // Validate time range
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }

      // Validate session is within event date range
      if (startTime < event.startDate || endTime > event.endDate) {
        return NextResponse.json(
          {
            error: "Session must be within event date range",
          },
          { status: 400 }
        );
      }

      // Create session
      const session = await prisma.eventSession.create({
        data: {
          eventId,
          name: validatedData.name,
          description: validatedData.description,
          type: validatedData.type,
          track: validatedData.track,
          room: validatedData.room,
          startTime,
          endTime,
          capacity: validatedData.capacity,
          speakers: validatedData.speakers as any,
          requiresSeparateCheckin: validatedData.requiresSeparateCheckin,
          status: validatedData.status,
        },
        include: {
          _count: { select: { checkIns: true } },
        },
      });

      // Auto-create a dedicated check-in station when the session requires one
      if (validatedData.requiresSeparateCheckin) {
        await prisma.station.create({
          data: {
            eventId,
            name: `${validatedData.name} — Check-in`,
            type: "session_checkin", // Use lowercase as defined in Zod enum
            isActive: true,
            sessions: {
              connect: { id: session.id },
            },
          },
        });
      }

      return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues,
          },
          { status: 400 }
        );
      }

      console.error("Failed to create session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
  }
);
