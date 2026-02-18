import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STAFF_ALLOWED_API_PATTERNS = {
  checkIn: /^\/api\/events\/[^/]+\/check-in(?:\/stats)?$/,
  stationsList: /^\/api\/events\/[^/]+\/stations$/,
};

/**
 * API middleware to ensure tenant isolation.
 * Use this in API routes to get the authenticated user and their active organization.
 */
export async function withTenant(request: NextRequest) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    // Get active org ID from session first (same as auth-utils — avoids extra DB call and timeouts)
    const rawSession = session.session as { activeOrganizationId?: string };
    let organizationId = rawSession?.activeOrganizationId;

    // Fallback: getActiveMember (response can be .data.organizationId or top-level .organizationId)
    if (!organizationId) {
      const activeMember = await auth.api.getActiveMember({
        headers: request.headers,
      });
      organizationId =
        (activeMember as { data?: { organizationId?: string }; organizationId?: string })?.data?.organizationId ??
        (activeMember as { organizationId?: string })?.organizationId;
    }

    if (!organizationId) {
      return {
        error: NextResponse.json(
          {
            error: "No active organization",
            message: "Please select an organization first",
          },
          { status: 403 }
        ),
      };
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return {
        error: NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        ),
      };
    }

    const memberRecord = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
      select: { id: true, role: true },
    });

    if (!memberRecord) {
      return {
        error: NextResponse.json(
          { error: "Not a member of this organization" },
          { status: 403 }
        ),
      };
    }

    // Restrict scanner/staff accounts to check-in specific APIs only.
    if (memberRecord.role === "staff") {
      const pathname = new URL(request.url).pathname;
      const method = request.method.toUpperCase();

      const canAccessCheckIn = STAFF_ALLOWED_API_PATTERNS.checkIn.test(pathname);
      const canAccessStationsList =
        method === "GET" && STAFF_ALLOWED_API_PATTERNS.stationsList.test(pathname);

      if (!canAccessCheckIn && !canAccessStationsList) {
        return {
          error: NextResponse.json(
            {
              error: "Forbidden",
              message:
                "Staff accounts can only use check-in endpoints. Ask an owner/cohost for management access.",
            },
            { status: 403 }
          ),
        };
      }
    }

    return {
      user: session.user,
      organization,
      member: {
        organizationId,
        userId: session.user.id,
        memberId: memberRecord.id,
        role: memberRecord.role,
      },
      tenantId: organization.id,
    };
  } catch (error) {
    console.error("withTenant middleware error:", error);
    return {
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Wrapper for API route handlers that require tenant context.
 * Usage:
 *   export const GET = withTenantHandler(async (req, context) => {
 *     const { tenantId, user, organization } = context;
 *     // Your logic here
 *   });
 */
export function withTenantHandler<T = any>(
  handler: (
    request: NextRequest,
    context: {
      user: any;
      organization: any;
      member: any;
      tenantId: string;
      params?: Promise<T>;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: { params: Promise<T> }) => {
    const result = await withTenant(request);

    if ("error" in result) {
      return result.error;
    }

    return handler(request, { ...result, params: routeContext?.params });
  };
}
