import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateSessionSchema } from "@/lib/validations/session";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/sessions/[sessionId]
 * Get a single session by ID
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, sessionId } = (await params) as {
      id: string;
      sessionId: string;
    };

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

    const session = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId,
      },
      include: {
        _count: {
          select: {
            checkIns: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  }
);

/**
 * PUT /api/events/[id]/sessions/[sessionId]
 * Update a session
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId, sessionId } = (await params) as {
        id: string;
        sessionId: string;
      };
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

      // Check session exists
      const existingSession = await prisma.eventSession.findFirst({
        where: {
          id: sessionId,
          eventId,
        },
      });

      if (!existingSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      // Validate input
      const validatedData = updateSessionSchema.parse(body);

      // Validate time range if both times are being updated
      if (validatedData.startTime && validatedData.endTime) {
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
      }

      // Update session
      const session = await prisma.eventSession.update({
        where: { id: sessionId },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.track !== undefined && {
            track: validatedData.track,
          }),
          ...(validatedData.room !== undefined && {
            room: validatedData.room,
          }),
          ...(validatedData.startTime && {
            startTime: new Date(validatedData.startTime),
          }),
          ...(validatedData.endTime && {
            endTime: new Date(validatedData.endTime),
          }),
          ...(validatedData.capacity !== undefined && {
            capacity: validatedData.capacity,
          }),
          ...(validatedData.speakers !== undefined && {
            speakers: validatedData.speakers as any,
          }),
          ...(validatedData.requiresSeparateCheckin !== undefined && {
            requiresSeparateCheckin: validatedData.requiresSeparateCheckin,
          }),
          ...(validatedData.status && { status: validatedData.status }),
        },
        include: {
          _count: {
            select: {
              checkIns: true,
            },
          },
        },
      });

      // Auto-create station if toggled on and doesn't exist
      if (validatedData.requiresSeparateCheckin) {
        // Check if session already has a check-in station assigned
        const sessionWithStations = await prisma.eventSession.findUnique({
          where: { id: sessionId },
          include: { stationAssignments: { where: { type: "session_checkin" } } },
        });

        if (sessionWithStations && sessionWithStations.stationAssignments.length === 0) {
          await prisma.station.create({
            data: {
              eventId,
              name: `${session.name} — Check-in`,
              type: "session_checkin",
              isActive: true,
              sessions: {
                connect: { id: sessionId },
              },
            },
          });
        }
      }

      return NextResponse.json({ session });
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

      console.error("Failed to update session:", error);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/events/[id]/sessions/[sessionId]
 * Delete a session
 */
export const DELETE = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, sessionId } = (await params) as {
      id: string;
      sessionId: string;
    };

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

    // Check session exists
    const session = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Delete the session (hard delete, as there's no soft delete in schema)
    await prisma.eventSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      message: "Session deleted successfully",
      deletedSessionId: sessionId,
    });
  }
);
