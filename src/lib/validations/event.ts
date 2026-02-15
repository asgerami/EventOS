import { z } from "zod";

export const eventStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(5000).optional().nullable(),
  location: z
    .object({
      venue: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timezone: z.string().default("UTC"),
  capacity: z.number().int().min(0).default(0),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  status: eventStatusEnum.default("DRAFT"),
  registrationSettings: z.record(z.string(), z.any()).optional().nullable(),
  brandingSettings: z.record(z.string(), z.any()).optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
