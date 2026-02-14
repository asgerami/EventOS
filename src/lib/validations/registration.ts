import { z } from "zod";

export const registrationStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
  "REJECTED",
]);

export const createRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email"),
  ticketTypeId: z.string().uuid("Invalid ticket type"),
  sessionIds: z.array(z.string().uuid()).default([]),
  channel: z.enum(["public", "invite", "csv", "walkin", "api"]).default("public"),
  customFieldValues: z.record(z.any()).optional().nullable(),
});

export const updateRegistrationSchema = z.object({
  status: registrationStatusEnum.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  sessionIds: z.array(z.string().uuid()).optional(),
  customFieldValues: z.record(z.any()).optional().nullable(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
