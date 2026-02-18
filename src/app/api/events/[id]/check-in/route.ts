import { NextResponse } from "next/server";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/** Roles that are allowed to perform check-in (scan) at events */
const SCAN_ALLOWED_ROLES = ["owner", "cohost", "staff"];

/**
 * POST /api/events/[id]/check-in
 * Body: { token: string (confirmationToken), stationId: string, sessionId?: string, method?: 'qr_scan' | 'manual' | 'nfc' }
 * Performs check-in for a registration. Only organization members with owner, cohost, or staff role can scan.
 */
export const POST = withTenantHandler(
  async (request, { tenantId, params, user, member }) => {
    if (!SCAN_ALLOWED_ROLES.includes(member.role)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only organizers and staff (scanners) can perform check-in. Ask your event organizer to add you as staff.",
        },
        { status: 403 }
      );
    }

    try {
      const { id: eventId } = (await params) as { id: string };
      const body = await request.json();

      const token =
        typeof body.token === "string" ? body.token.trim() : null;
      const stationId =
        typeof body.stationId === "string" ? body.stationId : null;
      const sessionId =
        typeof body.sessionId === "string" ? body.sessionId || null : null;
      const method =
        body.method === "qr_scan" || body.method === "manual" || body.method === "nfc"
          ? body.method
          : "manual";

      if (!token) {
        return NextResponse.json(
          { error: "Missing token (confirmation token from QR or ticket)" },
          { status: 400 }
        );
      }
      if (!stationId) {
        return NextResponse.json(
          { error: "Missing stationId" },
          { status: 400 }
        );
      }

      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId, deletedAt: null },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const station = await prisma.station.findFirst({
        where: { id: stationId, eventId, isActive: true },
      });
      if (!station) {
        return NextResponse.json(
          { error: "Station not found or inactive" },
          { status: 404 }
        );
      }

      const registration = await prisma.registration.findFirst({
        where: {
          eventId,
          confirmationToken: token,
        },
        include: {
          ticketType: { select: { name: true } },
        },
      });

      if (!registration) {
        return NextResponse.json(
          { error: "Invalid or unknown ticket. No registration found for this token." },
          { status: 404 }
        );
      }

      const sessionIdForUnique = sessionId ?? null;

      const existing = await prisma.checkIn.findFirst({
        where: {
          registrationId: registration.id,
          sessionId: sessionIdForUnique,
          type: "CHECKIN",
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "Already checked in",
            alreadyCheckedIn: true,
            attendee: `${registration.firstName} ${registration.lastName}`,
            checkedInAt: existing.scannedAt,
          },
          { status: 409 }
        );
      }

      const checkIn = await prisma.checkIn.create({
        data: {
          registrationId: registration.id,
          stationId,
          sessionId: sessionIdForUnique,
          scannedBy: user.id,
          type: "CHECKIN",
          method,
        },
        include: {
          registration: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              ticketType: { select: { name: true } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        checkIn: {
          id: checkIn.id,
          scannedAt: checkIn.scannedAt,
        },
        attendee: {
          name: `${checkIn.registration.firstName} ${checkIn.registration.lastName}`,
          email: checkIn.registration.email,
          ticketType: checkIn.registration.ticketType.name,
        },
      });
    } catch (error) {
      console.error("Check-in error:", error);
      return NextResponse.json(
        { error: "Check-in failed" },
        { status: 500 }
      );
    }
  }
);
