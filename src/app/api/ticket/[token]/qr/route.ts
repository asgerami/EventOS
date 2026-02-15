import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/ticket/[token]/qr
 * Public: returns a PNG QR code encoding the confirmation token (for scanning at check-in).
 * Validates that the token exists before generating.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const exists = await prisma.registration.findFirst({
    where: { confirmationToken: token.trim() },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  try {
    const QRCode = (await import("qrcode")).default;
    const png = await QRCode.toBuffer(token.trim(), {
      type: "png",
      width: 280,
      margin: 2,
    });

    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("QR generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
