import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Get active organization
    const activeMember = await auth.api.getActiveMember({
      headers: request.headers,
    });

    if (!activeMember?.data?.organizationId) {
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
      where: { id: activeMember.data.organizationId },
    });

    if (!organization) {
      return {
        error: NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        ),
      };
    }

    return {
      user: session.user,
      organization,
      member: activeMember.data,
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
