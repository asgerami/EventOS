# Multi-Tenant Isolation Guide

EventOS uses **better-auth's organization plugin** to implement multi-tenant isolation. Each organization (tenant) has completely isolated data.

## Key Concepts

- **Tenant** = **Organization** (in better-auth terms)
- Every user can belong to multiple organizations
- Users have one **active organization** at a time
- All database queries **must** be scoped by `tenantId`/`organizationId`

## Server-Side Isolation

### 1. Getting the active organization

```typescript
import { requireOrganization } from "@/lib/auth-utils";

export default async function MyPage() {
  const { session, organization } = await requireOrganization();
  
  // Now you have the active org; query is automatically scoped
  const events = await prisma.event.findMany({
    where: { tenantId: organization.id },
  });
}
```

### 2. API routes with tenant isolation

```typescript
import { withTenantHandler } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withTenantHandler(async (request, { tenantId }) => {
  // tenantId is automatically extracted from session
  const events = await prisma.event.findMany({
    where: { tenantId },
  });
  return NextResponse.json({ events });
});
```

## Client-Side Isolation

### 1. Get active organization in React

```typescript
"use client";
import { authClient } from "@/lib/auth-client";

function MyComponent() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  
  if (!activeOrg) {
    return <p>No organization selected</p>;
  }
  
  return <p>Active: {activeOrg.name}</p>;
}
```

### 2. Switch organization

```typescript
await authClient.organization.setActive({ organizationId: "org-id" });
```

## Database Rules

**Critical:** Every query **must** include `tenantId` in the `where` clause:

```typescript
// ✅ GOOD
prisma.event.findMany({ where: { tenantId } });

// ❌ BAD - can see all tenants' events
prisma.event.findMany();
```

## Utilities

| File | Purpose |
|------|---------|
| `src/lib/auth-utils.ts` | `getSession()`, `requireAuth()`, `getActiveOrganization()`, `requireOrganization()` |
| `src/lib/api-middleware.ts` | `withTenant()`, `withTenantHandler()` for API route isolation |
| `src/lib/tenant.ts` | Tenant-scoped query helpers (optional wrapper for Prisma) |

## Pages

- `/organizations` — Select or create an organization
- `/dashboard` — Requires active org; redirects to `/organizations` if none

## Next Steps

When adding new features:
1. Use `requireOrganization()` in server pages that need tenant context
2. Use `withTenantHandler()` in API routes
3. Always include `tenantId` in Prisma queries for Event, Session, Registration, Station, etc.
