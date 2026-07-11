import z from "zod";

const RunPointSchema = z.object({
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
});

export const CreateRunDto = z.object({
  routePoints: z.array(RunPointSchema).default([]),
  territoryPoints: z.array(RunPointSchema).default([]),
  distanceMeters: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(0),
});

export type CreateRunDto = z.infer<typeof CreateRunDto>;
