import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/organizations
 * Super Admin only. Returns all organizations with event and member counts.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { events: true, members: true },
      },
    },
  });

  return NextResponse.json({
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      logo: o.logo,
      createdAt: o.createdAt,
      eventCount: o._count.events,
      memberCount: o._count.members,
    })),
  });
}
