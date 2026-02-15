import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

type BadgeTemplate = "default" | "minimal" | "compact";

/**
 * GET /api/ticket/[token]/badge
 * Public: returns a PDF badge for the ticket. Template from event.brandingSettings.badgeTemplate.
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
      event: { select: { name: true, brandingSettings: true } },
      ticketType: { select: { name: true } },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const branding = registration.event.brandingSettings as { badgeTemplate?: string } | null;
  const template: BadgeTemplate =
    branding?.badgeTemplate === "minimal" || branding?.badgeTemplate === "compact"
      ? branding.badgeTemplate
      : "default";

  try {
    const qrBuffer = await QRCode.toBuffer(token.trim(), {
      type: "png",
      width: template === "minimal" ? 100 : 140,
      margin: 1,
    });

    const name = `${registration.firstName} ${registration.lastName}`.trim() || "Attendee";
    const eventName = registration.event.name;
    const ticketName = registration.ticketType.name;

    if (template === "minimal") {
      // Small badge: name + QR only
      const doc = new PDFDocument({
        size: [200, 280],
        layout: "portrait",
        margin: 16,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      const pdfDone = new Promise<Buffer>((resolve) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
      });
      doc.fontSize(12).fillColor("#111").text(name, 0, 0, { align: "center", width: 168 });
      doc.image(qrBuffer, 34, 28, { width: 100, height: 100 });
      doc.end();
      const pdf = await pdfDone;
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="badge-${name.replace(/\s+/g, "-")}.pdf"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (template === "compact") {
      // Event name small top, name prominent, QR, no ticket type
      const doc = new PDFDocument({
        size: [280, 380],
        layout: "portrait",
        margin: 24,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      const pdfDone = new Promise<Buffer>((resolve) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
      });
      doc.fontSize(8).fillColor("#888").text(eventName, 0, 0, { align: "center", width: 232 });
      doc.fontSize(20).fillColor("#111").text(name, 0, 22, { align: "center", width: 232 });
      doc.image(qrBuffer, 70, 52, { width: 92, height: 92 });
      doc.end();
      const pdf = await pdfDone;
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="badge-${name.replace(/\s+/g, "-")}.pdf"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // default: full badge with event, name, ticket type, QR
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
