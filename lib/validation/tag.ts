/**
 * Tag Validation Schemas
 *
 * Zod schemas for validating tag data in API endpoints.
 */

import { z } from 'zod';

/**
 * Schema for creating/adding a new tag to a client
 *
 * Validation rules:
 * - tag_name: Required, 1-100 characters, trimmed
 */
export const createTagSchema = z.object({
  tag_name: z
    .string()
    .min(1, 'Tag name is required')
    .max(100, 'Tag name must be 100 characters or less')
    .transform((val) => val.trim()),
});

/**
 * TypeScript type derived from Zod schema
 */
export type CreateTagInput = z.infer<typeof createTagSchema>;
