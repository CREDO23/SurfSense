/** Zod schemas and inferred types for relation scene data. */
import { z } from "zod";

export const RelationNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  desc: z.string().nullish(),
  color: z.string().nullish(),
});

export type RelationNode = z.infer<typeof RelationNodeSchema>;

export const RelationEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().nullish(),
});

export type RelationEdge = z.infer<typeof RelationEdgeSchema>;

export const RelationSceneInput = z.object({
  type: z.literal("relation"),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  nodes: z.array(RelationNodeSchema).min(1),
  edges: z.array(RelationEdgeSchema).default([]),
});

export type RelationSceneInput = z.infer<typeof RelationSceneInput>;

/** Node with computed layout position. */
export interface LayoutNode {
  data: RelationNode;
  x: number;
  y: number;
  index: number;
}

/** Camera stop. */
export interface Waypoint {
  cx: number;
  cy: number;
  holdFrames: number;
  transitionAfter: number;
}
