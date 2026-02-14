import { z } from "zod";

export const createTicketTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  price: z.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  sessionAccess: z.enum(["all", "specific"]).default("all"),
  allowedSessionIds: z.array(z.string().uuid()).optional().default([]),
  perks: z.record(z.any()).optional().nullable(),
});

export const updateTicketTypeSchema = createTicketTypeSchema.partial();

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;
export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;
