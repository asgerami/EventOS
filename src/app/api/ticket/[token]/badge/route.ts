import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

/**
 * GET /api/ticket/[token]/badge
 * Public: returns a PDF badge for the ticket (name, event, ticket type, QR).
 * Validates token before generating.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const registration = await prisma.registration.findFirst({
    where: { confirmationToken: token.trim() },
    select: {
      firstName: true,
      lastName: true,
      event: { select: { name: true } },
      ticketType: { select: { name: true } },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  try {
    const qrBuffer = await QRCode.toBuffer(token.trim(), {
      type: "png",
      width: 140,
      margin: 1,
    });

    const doc = new PDFDocument({
      size: [280, 430],
      layout: "portrait",
      margin: 24,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const pdfDone = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const name = `${registration.firstName} ${registration.lastName}`.trim() || "Attendee";
    const eventName = registration.event.name;
    const ticketName = registration.ticketType.name;

    doc.fontSize(10).fillColor("#666").text(eventName, 0, 0, { align: "center", width: 232 });
    doc.fontSize(18).fillColor("#111").text(name, 0, 28, { align: "center", width: 232 });
    doc.fontSize(9).fillColor("#666").text(ticketName, 0, 54, { align: "center", width: 232 });

    doc.image(qrBuffer, 70, 72, { width: 92, height: 92 });

    doc.end();

    const pdf = await pdfDone;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="badge-${name.replace(/\s+/g, "-")}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Badge PDF error:", e);
    return NextResponse.json(
      { error: "Failed to generate badge" },
      { status: 500 }
    );
  }
}
