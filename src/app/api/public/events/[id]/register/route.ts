import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRegistrationSchema } from "@/lib/validations/registration";
import { sendTicketEmail } from "@/lib/email";
import { ZodError } from "zod";
import { randomBytes } from "crypto";

/**
 * POST /api/public/events/[id]/register
 * Public: create a registration (no auth). Event must be published.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const body = await request.json();

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        status: { in: ["PUBLISHED", "ONGOING"] },
      },
      include: { ticketTypes: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or registration is closed" },
        { status: 404 }
      );
    }

    const data = createRegistrationSchema.parse(body);
    data.channel = "public";

    const ticketType = event.ticketTypes.find((t) => t.id === data.ticketTypeId);
    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }
    if (ticketType.sold >= ticketType.quantity) {
      return NextResponse.json(
        { error: "This ticket type is sold out" },
        { status: 409 }
      );
    }

    const existing = await prisma.registration.findUnique({
      where: { eventId_email: { eventId, email: data.email } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered for this event" },
        { status: 409 }
      );
    }

    const confirmationToken = randomBytes(32).toString("hex");

    const registration = await prisma.registration.create({
      data: {
        eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ticketTypeId: data.ticketTypeId,
        sessionIds: data.sessionIds ?? [],
        channel: "public",
        customFieldValues: data.customFieldValues as any,
        confirmationToken,
        status: "PENDING",
      },
      include: {
        ticketType: { select: { name: true } },
      },
    });

    await prisma.ticketType.update({
      where: { id: data.ticketTypeId },
      data: { sold: { increment: 1 } },
    });

    const base =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const ticketUrl = `${base}/ticket/${confirmationToken}`;
    await sendTicketEmail({
      to: registration.email,
      attendeeName: `${registration.firstName} ${registration.lastName}`,
      eventName: event.name,
      ticketUrl,
      ticketTypeName: registration.ticketType.name,
    });

    return NextResponse.json(
      {
        registration: {
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName,
          ticketTypeName: registration.ticketType.name,
          confirmationToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Public register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
