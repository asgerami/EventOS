import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateStationSchema } from "@/lib/validations/station";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/stations/[stationId]
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, stationId } = (await params) as { id: string; stationId: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const station = await prisma.station.findFirst({
      where: { id: stationId, eventId },
      include: { _count: { select: { checkIns: true } } },
    });
    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json({ station });
  }
);

/**
 * PUT /api/events/[id]/stations/[stationId]
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId, stationId } = (await params) as { id: string; stationId: string };
      const body = await request.json();

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const existing = await prisma.station.findFirst({
        where: { id: stationId, eventId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }

      const data = updateStationSchema.parse(body);

      const station = await prisma.station.update({
        where: { id: stationId },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.type != null && { type: data.type }),
          ...(data.isActive != null && { isActive: data.isActive }),
        },
        include: { _count: { select: { checkIns: true } } },
      });

      return NextResponse.json({ station });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Failed to update station:", error);
      return NextResponse.json(
        { error: "Failed to update station" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/events/[id]/stations/[stationId]
 */
export const DELETE = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, stationId } = (await params) as { id: string; stationId: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existing = await prisma.station.findFirst({
      where: { id: stationId, eventId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    await prisma.station.delete({ where: { id: stationId } });
    return NextResponse.json({ message: "Station deleted", deletedId: stationId });
  }
);
