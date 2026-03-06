/** Zod schema and types for outro scene. */
import { z } from "zod";

export const OutroSceneInput = z.object({
  type: z.literal("outro"),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
});

export type OutroSceneInput = z.infer<typeof OutroSceneInput>;
