import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { updateRegistrationSchema } from "@/lib/validations/registration";
import { sendTicketEmail } from "@/lib/email";
import { ZodError } from "zod";

/**
 * GET /api/events/[id]/registrations/[registrationId]
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId, registrationId } = (await params) as { id: string; registrationId: string };

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      include: {
        ticketType: { select: { id: true, name: true, price: true, currency: true } },
        checkIns: {
          orderBy: { scannedAt: "desc" },
          include: {
            station: { select: { id: true, name: true, type: true } },
            session: { select: { id: true, name: true, startTime: true, endTime: true, room: true } },
            scanner: { select: { id: true, name: true } },
          },
        },
        badges: {
          orderBy: { printedAt: "desc" },
          select: { id: true, printedAt: true, template: true },
        },
      },
    });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ registration });
  }
);

/**
 * PUT /api/events/[id]/registrations/[registrationId]
 * Update registration (e.g. status to CONFIRMED)
 */
export const PUT = withTenantHandler(
  async (request, { tenantId, params }) => {
    try {
      const { id: eventId, registrationId } = (await params) as { id: string; registrationId: string };
      const body = await request.json();

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const existing = await prisma.registration.findFirst({
        where: { id: registrationId, eventId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }

      const data = updateRegistrationSchema.parse(body);

      const registration = await prisma.registration.update({
        where: { id: registrationId },
        data: {
          ...(data.status != null && { status: data.status }),
          ...(data.firstName != null && { firstName: data.firstName }),
          ...(data.lastName != null && { lastName: data.lastName }),
          ...(data.email != null && { email: data.email }),
          ...(data.sessionIds != null && { sessionIds: data.sessionIds }),
          ...(data.customFieldValues !== undefined && { customFieldValues: data.customFieldValues as any }),
          ...(data.status === "CONFIRMED" && !existing.confirmedAt && { confirmedAt: new Date() }),
        },
        include: {
          ticketType: { select: { id: true, name: true, price: true, currency: true } },
        },
      });

      // Optional: send ticket email when staff confirms (fire-and-forget)
      if (data.status === "CONFIRMED" && !existing.confirmedAt && registration.confirmationToken) {
        const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const ticketUrl = `${base}/ticket/${registration.confirmationToken}`;
        sendTicketEmail({
          to: registration.email,
          attendeeName: `${registration.firstName} ${registration.lastName}`,
          eventName: event.name,
          ticketUrl,
          ticketTypeName: registration.ticketType.name,
        }).catch((e) => console.error("[Email] Ticket on confirm failed:", e));
      }

      return NextResponse.json({ registration });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Failed to update registration:", error);
      return NextResponse.json(
        { error: "Failed to update registration" },
        { status: 500 }
      );
    }
  }
);
