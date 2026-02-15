import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createEventSchema } from "@/lib/validations/event";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * GET /api/events
 * List all events for the active organization
 */
export const GET = withTenantHandler(async (request, { tenantId }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Prisma.EventWhereInput = {
    tenantId,
    deletedAt: null, // Exclude soft-deleted events
    ...(status && { status: status as any }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        capacity: true,
        visibility: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: true,
            sessions: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    events,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
  });
});

/**
 * POST /api/events
 * Create a new event for the active organization
 */
export const POST = withTenantHandler(async (request, { tenantId }) => {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createEventSchema.parse(body);

    // Generate slug if not provided
    const slug =
      validatedData.slug ||
      validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for slug uniqueness within tenant
    const existing = await prisma.event.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An event with this slug already exists" },
        { status: 409 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        tenantId,
        name: validatedData.name,
        slug,
        description: validatedData.description,
        location: validatedData.location as any,
        startDate,
        endDate,
        timezone: validatedData.timezone,
        capacity: validatedData.capacity,
        visibility: validatedData.visibility,
        status: validatedData.status,
        registrationSettings: validatedData.registrationSettings as any,
        brandingSettings: validatedData.brandingSettings as any,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
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

    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
});
