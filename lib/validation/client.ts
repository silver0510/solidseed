/**
 * Client Validation Schemas
 *
 * Zod schemas for validating client data in API endpoints.
 * Used for both creation and update operations.
 */

import { z } from 'zod';

/**
 * Phone number regex pattern for US phone numbers
 * Accepts 10 digits with optional formatting
 * Examples: 5551234567, 555-123-4567, (555) 123-4567, +15551234567
 */
const phoneRegex = /^(\+?1)?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/;

/**
 * Transform phone number to standard format: +1-XXX-XXX-XXXX
 */
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Extract digits only
  const digits = cleaned.replace(/\D/g, '');

  // If 10 digits, add country code
  if (digits.length === 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // If 11 digits and starts with 1, format it
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if doesn't match expected format
  return phone;
};

/**
 * Schema for creating a new client
 *
 * Required fields:
 * - name: Client's full name (non-empty string)
 * - email: Valid email address
 *
 * Optional fields:
 * - phone: US phone number (10 digits, auto-formatted to +1-XXX-XXX-XXXX)
 * - status_id: UUID for client status
 * - tags: Array of tag names
 * - birthday: ISO date string
 * - address: Free-form text address
 */
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.preprocess(
    (val) => {
      // Convert empty string to undefined
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    },
    z
      .string()
      .refine(
        (val) => phoneRegex.test(val),
        { message: 'Phone must be a valid 10-digit US phone number' }
      )
      .transform(formatPhoneNumber)
      .optional()
  ),
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
