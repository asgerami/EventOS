import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/registrations/[registrationId]/ticket-url
 * Returns the public ticket URL for this registration (staff only, tenant-scoped).
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, registrationId } = (await params) as {
      id: string;
      registrationId: string;
    };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      select: { confirmationToken: true },
    });
    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const path = `/ticket/${registration.confirmationToken}`;
    return NextResponse.json({ path, token: registration.confirmationToken });
  }
);
