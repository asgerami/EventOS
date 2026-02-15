import { z } from "zod";

export const stationTypeEnum = z.enum([
  "entrance",
  "session_room",
  "vip",
  "registration_desk",
  "other",
]);

export const createStationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: stationTypeEnum.default("entrance"),
  isActive: z.boolean().default(true),
});

export const updateStationSchema = createStationSchema.partial();

export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;
