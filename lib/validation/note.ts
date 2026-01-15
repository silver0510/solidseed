/**
 * Note Validation Schemas
 *
 * Zod schemas for validating note data in API endpoints.
 */

import { z } from 'zod';

/**
 * Schema for creating a new note
 *
 * Validation rules:
 * - content: Required, minimum 1 character (non-empty after trim)
 * - is_important: Optional boolean, defaults to false
 */
export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Note content cannot be empty'),
  is_important: z.boolean().optional().default(false),
});

/**
 * Schema for updating an existing note
 *
 * All fields are optional (partial update).
 * When provided, fields must still pass validation.
 */
export const updateNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Note content cannot be empty')
    .optional(),
  is_important: z.boolean().optional(),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
