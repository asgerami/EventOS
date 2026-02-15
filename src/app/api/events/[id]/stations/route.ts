import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { createStationSchema } from "@/lib/validations/station";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/stations
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

    const stations = await prisma.station.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
      include: { _count: { select: { checkIns: true } } },
    });

    return NextResponse.json({ stations });
  }
);

/**
 * POST /api/events/[id]/stations
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

      const data = createStationSchema.parse(body);

      const station = await prisma.station.create({
        data: {
          eventId,
          name: data.name,
          type: data.type,
          isActive: data.isActive,
        },
        include: { _count: { select: { checkIns: true } } },
      });

      return NextResponse.json({ station }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Failed to create station:", error);
      return NextResponse.json(
        { error: "Failed to create station" },
        { status: 500 }
      );
    }
  }
);
