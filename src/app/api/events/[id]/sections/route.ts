import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { z } from "zod";

const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  type: z.enum(["about", "faq", "sponsors", "custom"]),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

/**
 * GET /api/events/[id]/sections
 */
export const GET = withTenantHandler(
  async (_request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const sections = await prisma.eventSection.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ sections });
  }
);

/**
 * POST /api/events/[id]/sections
 */
export const POST = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = sectionSchema.parse(body);

    const section = await prisma.eventSection.create({
      data: { eventId, ...data },
    });

    return NextResponse.json({ section }, { status: 201 });
  }
);

/**
 * PUT /api/events/[id]/sections
 * Body must include `sectionId` and fields to update.
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sectionId, ...rest } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    const existing = await prisma.eventSection.findFirst({
      where: { id: sectionId, eventId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updates = sectionSchema.partial().parse(rest);

    const section = await prisma.eventSection.update({
      where: { id: sectionId },
      data: updates,
    });

    return NextResponse.json({ section });
  }
);

/**
 * DELETE /api/events/[id]/sections
 * Body must include `sectionId`.
 */
export const DELETE = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    const existing = await prisma.eventSection.findFirst({
      where: { id: sectionId, eventId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.eventSection.delete({ where: { id: sectionId } });

    return NextResponse.json({ message: "Section deleted" });
  }
);
