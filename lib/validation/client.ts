/**
 * Client Validation Schemas
 *
 * Zod schemas for validating client data in API endpoints.
 * Used for both creation and update operations.
 */

import { z } from 'zod';

/**
 * Phone number regex pattern
 * Format: +1-XXX-XXX-XXXX
 * Example: +1-555-123-4567
 */
const phoneRegex = /^\+1-\d{3}-\d{3}-\d{4}$/;

/**
 * Schema for creating a new client
 *
 * Required fields:
 * - name: Client's full name (non-empty string)
 * - email: Valid email address
 *
 * Optional fields:
 * - phone: US phone number in format +1-XXX-XXX-XXXX
 * - status_id: UUID for client status
 * - tags: Array of tag names
 * - birthday: ISO date string
 * - address: Free-form text address
 */
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(phoneRegex, 'Phone must be in format +1-XXX-XXX-XXXX')
    .optional(),
  status_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  birthday: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Schema for updating an existing client
 *
 * All fields are optional (partial update).
 * When provided, fields must still pass validation.
 */
export const updateClientSchema = createClientSchema.partial();

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
