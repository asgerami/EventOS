import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Debug endpoint to inspect session state
 * GET /api/debug/session
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });

    return NextResponse.json({
      session: session?.session ? {
        id: session.session.id,
        userId: session.session.userId,
        activeOrganizationId: (session.session as any).activeOrganizationId,
        expiresAt: session.session.expiresAt,
      } : null,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      } : null,
      activeMember: activeMember?.data || null,
    });
  } catch (error) {
    console.error("[Debug Session] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
