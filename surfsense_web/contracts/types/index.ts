import { z } from "zod";

// Backend uses both pagination styles across different endpoints:
// - Most endpoints use: limit/skip (offset-based)
// - Some endpoints use: page/page_size (page-based)
// Supporting both for compatibility until backend is normalized
export const paginationQueryParams = z.object({
	limit: z.number().optional(),
	skip: z.number().optional(),
	page: z.number().optional(),
	page_size: z.number().optional(),
});

export type PaginationQueryParams = z.infer<typeof paginationQueryParams>;
