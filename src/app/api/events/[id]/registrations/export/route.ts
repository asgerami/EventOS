import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

/**
 * GET /api/events/[id]/registrations/export?format=csv|pdf
 * Export event registrations as CSV or PDF (tenant-scoped).
 */
export const GET = withTenantHandler(
  async (request, { tenantId, params }) => {
    const { id: eventId } = (await params) as { id: string };
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv").toLowerCase();

    if (format !== "csv" && format !== "pdf") {
      return NextResponse.json(
        { error: "Unsupported format. Use format=csv or format=pdf" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      orderBy: { registeredAt: "asc" },
      include: {
        ticketType: { select: { name: true } },
      },
    });

    const safeName = event.name.replace(/[^a-z0-9]/gi, "-");

    if (format === "pdf") {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        const pdfDone = new Promise<Buffer>((resolve) => {
          doc.on("end", () => resolve(Buffer.concat(chunks)));
        });

        doc.fontSize(16).text(event.name, { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#666").text(`Registrations · ${registrations.length} attendees · Generated ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown(1.5).fillColor("#000");

        const colWidths = [90, 90, 120, 80, 70, 95];
        const headers = ["First name", "Last name", "Email", "Ticket", "Status", "Registered"];
        doc.fontSize(9).font("Helvetica-Bold");
        let y = doc.y;
        headers.forEach((h, i) => {
          doc.text(h, 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i], continued: false });
        });
        doc.moveDown(0.3);
        doc.strokeColor("#ccc").moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font("Helvetica").fontSize(8);

        registrations.forEach((r) => {
          if (doc.y > 800) {
            doc.addPage();
            doc.y = 40;
          }
          const rowY = doc.y;
          const cells = [
            r.firstName,
            r.lastName,
            r.email,
            r.ticketType.name,
            r.status,
            new Date(r.registeredAt).toLocaleDateString(undefined, { dateStyle: "short" }),
          ];
          cells.forEach((cell, i) => {
            doc.text(String(cell).slice(0, 28), 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), rowY, { width: colWidths[i], ellipsis: true });
          });
          doc.y = rowY;
          doc.moveDown(0.6);
        });

        doc.end();
        const pdf = await pdfDone;

        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="registrations-${safeName}-${eventId.slice(0, 8)}.pdf"`,
          },
        });
      } catch (e) {
        console.error("Registrations PDF export error:", e);
        return NextResponse.json(
          { error: "Failed to generate PDF" },
          { status: 500 }
        );
      }
    }

    const headers = [
      "First name",
      "Last name",
      "Email",
      "Ticket type",
      "Status",
      "Registered at",
      "Channel",
    ];
    const rows = registrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.ticketType.name,
      r.status,
      new Date(r.registeredAt).toISOString(),
      r.channel,
    ]);

    const escape = (v: string) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n"))
        return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registrations-${safeName}-${eventId.slice(0, 8)}.csv"`,
      },
    });
  }
);
