/** Zod schemas and inferred types for chart scene data. */
import { z } from "zod";

export const ChartItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().nullish(),
});

export type ChartItem = z.infer<typeof ChartItemSchema>;

export const ChartSceneInput = z.object({
  type: z.literal("chart"),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  xTitle: z.string().nullish(),
  yTitle: z.string().nullish(),
  items: z.array(ChartItemSchema).min(1),
});

export type ChartSceneInput = z.infer<typeof ChartSceneInput>;
