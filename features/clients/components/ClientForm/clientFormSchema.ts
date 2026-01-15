/**
 * Client Form Validation Schema
 *
 * Zod schema for validating client form input data.
 * Enforces required fields and format validation.
 *
 * @module features/clients/components/ClientForm/clientFormSchema
 */

import { z } from 'zod';
import { PHONE_FORMAT_REGEX } from '@/features/clients/types';

/**
 * Phone number format regex for validation
 * Format: +1-XXX-XXX-XXXX
 */
const phoneFormatRegex = PHONE_FORMAT_REGEX;

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
 * - phone: +1-XXX-XXX-XXXX format
 *
 * Optional fields:
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
    .regex(phoneFormatRegex, {
      message: 'Phone must be in format +1-XXX-XXX-XXXX',
    }),

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
  birthday: '',
  address: '',
};
