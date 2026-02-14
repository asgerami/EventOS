import { z } from "zod";

export const sessionTypeEnum = z.enum([
  "conference",
  "workshop",
  "panel",
  "keynote",
  "networking",
  "other",
]);

export const createSessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: sessionTypeEnum.default("conference"),
  track: z.string().max(100).optional().nullable(),
  room: z.string().max(100).optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().min(0).optional().nullable(),
  speakers: z
    .array(
      z.object({
        name: z.string(),
        title: z.string().optional(),
        bio: z.string().optional(),
        photo: z.string().optional(),
      })
    )
    .optional()
    .nullable(),
  requiresSeparateCheckin: z.boolean().default(false),
  status: z.string().default("scheduled"),
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
