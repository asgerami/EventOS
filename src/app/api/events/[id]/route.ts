import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateEventSchema } from "@/lib/validations/event";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]
 * Get a single event by ID
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        sessions: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            capacity: true,
            type: true,
          },
          orderBy: { startTime: "asc" },
        },
        ticketTypes: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            quantity: true,
            sold: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            stations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  }
);

/**
 * PUT /api/events/[id]
 * Update an event
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id } = (await params) as { id: string };
      const body = await request.json();

      // Validate input
      const validatedData = updateEventSchema.parse(body);

      // Check event exists and belongs to tenant
      const existingEvent = await prisma.event.findFirst({
        where: {
          id,
          tenantId,
          deletedAt: null,
        },
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      // Validate date range if both dates are being updated
      if (validatedData.startDate && validatedData.endDate) {
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);
        if (endDate < startDate) {
          return NextResponse.json(
            { error: "End date must be after start date" },
            { status: 400 }
          );
        }
      }

      // If slug is being updated, check uniqueness
      if (validatedData.slug && validatedData.slug !== existingEvent.slug) {
        const slugExists = await prisma.event.findFirst({
          where: {
            tenantId,
            slug: validatedData.slug,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (slugExists) {
          return NextResponse.json(
            { error: "An event with this slug already exists" },
            { status: 409 }
          );
        }
      }

      // Update event
      const event = await prisma.event.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.slug && { slug: validatedData.slug }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.coverImage !== undefined && {
            coverImage: validatedData.coverImage,
          }),
          ...(validatedData.location !== undefined && {
            location: validatedData.location as any,
          }),
          ...(validatedData.startDate && {
            startDate: new Date(validatedData.startDate),
          }),
          ...(validatedData.endDate && {
            endDate: new Date(validatedData.endDate),
          }),
          ...(validatedData.timezone && { timezone: validatedData.timezone }),
          ...(validatedData.capacity !== undefined && {
            capacity: validatedData.capacity,
          }),
          ...(validatedData.visibility && {
            visibility: validatedData.visibility,
          }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.registrationSettings !== undefined && {
            registrationSettings: validatedData.registrationSettings as any,
          }),
          ...(validatedData.brandingSettings !== undefined && {
            brandingSettings: {
              ...((existingEvent.brandingSettings as Record<string, unknown>) || {}),
              ...(validatedData.brandingSettings as Record<string, unknown>),
            } as any,
          }),
        },
        include: {
          _count: {
            select: {
              registrations: true,
              sessions: true,
              stations: true,
            },
          },
        },
      });

      return NextResponse.json({ event });
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

      console.error("Failed to update event:", error);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/events/[id]
 * Soft delete an event
 */
export const DELETE = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id } = (await params) as { id: string };

    // Check event exists and belongs to tenant
    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Soft delete the event
    await prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Event deleted successfully",
      deletedEventId: id,
    });
  }
);
