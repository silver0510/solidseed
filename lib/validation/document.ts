/**
 * Document Validation Schemas
 *
 * Zod schemas for validating document data in API endpoints.
 * Includes file type and size validation constants.
 */

import { z } from 'zod';

/**
 * Maximum file size allowed for uploads (10MB in bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10485760 bytes

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const;

/**
 * Allowed file extensions for display purposes
 */
export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
] as const;

/**
 * Type for allowed MIME types
 */
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Validate if a MIME type is allowed
 *
 * @param mimeType - The MIME type to validate
 * @returns true if the MIME type is allowed, false otherwise
 */
export function validateFileType(mimeType: string): boolean {
  if (!mimeType || mimeType.trim() === '') {
    return false;
  }
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Validate if a file size is within the allowed limit
 *
 * @param size - The file size in bytes
 * @returns true if the file size is within limit, false otherwise
 */
export function validateFileSize(size: number): boolean {
  return size >= 0 && size <= MAX_FILE_SIZE;
}

/**
 * Schema for validating document upload metadata
 *
 * Validation rules:
 * - file_name: Required, non-empty string
 * - file_type: Required, must be one of ALLOWED_MIME_TYPES
 * - file_size: Required, must be <= MAX_FILE_SIZE (10MB)
 * - description: Optional string, trimmed
 */
export const documentUploadSchema = z.object({
  file_name: z
    .string()
    .min(1, 'File name is required')
    .transform((val) => val.trim()),

  file_type: z
    .string()
    .refine((val) => validateFileType(val), {
      message: `File type must be one of: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
    }),

  file_size: z
    .number()
    .int()
    .min(0, 'File size must be non-negative')
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`),

  description: z
    .string()
    .transform((val) => val.trim())
    .optional(),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
