/**
 * Client Form Validation Schema
 *
 * Zod schema for validating client form input data.
 * Enforces required fields and format validation.
 *
 * @module features/clients/components/ClientForm/clientFormSchema
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
 * Validates that a date string represents a date in the past
 */
const isPastDate = (dateString: string): boolean => {
  if (!dateString) return true; // Empty is valid (optional field)
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Client form validation schema
 *
 * Required fields:
 * - name: non-empty string
 * - email: valid email format
 * - phone: 10-digit US phone number (flexible formats, auto-formatted)
 *
 * Optional fields:
 * - status_id: UUID for client status
 * - tags: array of tag names
 * - birthday: must be in the past if provided
 * - address: any string
 */
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .trim(),

  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim(),

  phone: z
    .string()
    .min(1, { message: 'Phone is required' })
    .refine(
      (val) => phoneRegex.test(val),
      { message: 'Phone must be a valid 10-digit US phone number' }
    )
    .transform(formatPhoneNumber),

  status_id: z.string().uuid().optional(),

  tags: z.array(z.string()).optional(),

  birthday: z
    .string()
    .optional()
    .refine((val) => !val || isPastDate(val), {
      message: 'Birthday must be in the past',
    }),

  address: z.string().optional(),
});

/**
 * Type inferred from the schema
 */
export type ClientFormSchemaType = z.infer<typeof clientFormSchema>;

/**
 * Default values for a new client form
 */
export const defaultClientFormValues: ClientFormSchemaType = {
  name: '',
  email: '',
  phone: '',
  status_id: undefined,
  tags: [],
  birthday: '',
  address: '',
};
