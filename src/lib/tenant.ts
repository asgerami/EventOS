import { prisma } from "@/lib/db";

/**
 * Tenant-scoped query helpers to ensure all queries are filtered by organizationId.
 * Use these instead of raw Prisma queries to prevent cross-tenant data leaks.
 */

export function getTenantPrisma(tenantId: string) {
  return {
    event: {
      findMany: (args?: any) =>
        prisma.event.findMany({ ...args, where: { ...args?.where, tenantId } }),
      findUnique: (args: any) =>
        prisma.event.findUnique({
          ...args,
          where: { ...args.where, tenantId },
        }),
      findFirst: (args?: any) =>
        prisma.event.findFirst({ ...args, where: { ...args?.where, tenantId } }),
      create: (args: any) =>
        prisma.event.create({ ...args, data: { ...args.data, tenantId } }),
      update: (args: any) =>
        prisma.event.update({
          ...args,
          where: { ...args.where, tenantId },
        }),
      delete: (args: any) =>
        prisma.event.delete({
          ...args,
          where: { ...args.where, tenantId },
        }),
    },
    // Add more models as needed (session, registration, etc.)
  };
}

/**
 * Verify that a resource belongs to the specified tenant.
 * Throws an error if not found or belongs to a different tenant.
 */
export async function verifyTenantOwnership(
  resourceType: "event" | "session" | "registration",
  resourceId: string,
  tenantId: string
) {
  switch (resourceType) {
    case "event": {
      const event = await prisma.event.findUnique({
        where: { id: resourceId },
        select: { tenantId: true },
      });
      if (!event || event.tenantId !== tenantId) {
        throw new Error("Resource not found or access denied");
      }
      return true;
    }
    // Add more cases as needed
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
}
