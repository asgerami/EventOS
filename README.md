# EventOS

Multi-tenant event management platform: registration, badges, check-in, and analytics.

## Stack

- **Next.js 16** (App Router)
- **Prisma** + PostgreSQL
- **better-auth** (organizations + admin, email/password)
- **Tailwind CSS** + shadcn/ui (radix-ui)
- **Zod** for validation

## Getting started

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string (e.g. Neon, Supabase, or local). **Neon:** use the **pooled** URL (`npx neonctl connection-string --pooled --prisma`) to avoid ETIMEDOUT on auth.
   - `BETTER_AUTH_URL` — App URL (e.g. `http://localhost:3000`)

2. **Database**

   ```bash
   npm run db:push    # Create/update tables (required before sign-up/sign-in)
   npm run db:studio  # Optional: open Prisma Studio
   ```

   If you see *"The table \`public.user\` does not exist"*, run `npm run db:push` from the project root.

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, then open the dashboard.

## Scripts

| Script        | Description                |
|---------------|----------------------------|
| `npm run dev` | Start dev server           |
| `npm run build` | Generate Prisma + build  |
| `npm run db:push` | Sync schema to DB       |
| `npm run db:studio` | Prisma Studio UI      |

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the phased plan (auth, events, registration, scanning, etc.).

## Requirements

See the refined requirements specification (PDF in repo) for the full EventOS spec.
