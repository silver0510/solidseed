/**
 * Unit Tests: Document Validation
 *
 * Tests Zod validation schemas for document data:
 * - Valid file types (PDF, DOC, DOCX, JPG, PNG)
 * - Invalid file types
 * - File size validation (max 10MB)
 * - Description field
 */

import { describe, it, expect } from 'vitest';
import {
  documentUploadSchema,
  validateFileType,
  validateFileSize,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
} from '@/lib/validation/document';

describe('Document Validation', () => {
  describe('Constants', () => {
    it('should export ALLOWED_MIME_TYPES with correct values', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
      expect(ALLOWED_MIME_TYPES).toContain('application/msword');
      expect(ALLOWED_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES).toContain('image/png');
      expect(ALLOWED_MIME_TYPES).toHaveLength(5);
    });

    it('should export MAX_FILE_SIZE as 10MB in bytes', () => {
      expect(MAX_FILE_SIZE).toBe(10485760); // 10 * 1024 * 1024
    });

    it('should export ALLOWED_FILE_EXTENSIONS', () => {
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.pdf');
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.doc');
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.docx');
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.jpg');
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.jpeg');
      expect(ALLOWED_FILE_EXTENSIONS).toContain('.png');
    });
  });

  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      expect(validateFileType('application/pdf')).toBe(true);
    });

    it('should accept DOC files', () => {
      expect(validateFileType('application/msword')).toBe(true);
    });

    it('should accept DOCX files', () => {
      expect(
        validateFileType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });

    it('should accept JPEG files', () => {
      expect(validateFileType('image/jpeg')).toBe(true);
    });

    it('should accept PNG files', () => {
      expect(validateFileType('image/png')).toBe(true);
    });

    it('should reject GIF files', () => {
      expect(validateFileType('image/gif')).toBe(false);
    });

    it('should reject text files', () => {
      expect(validateFileType('text/plain')).toBe(false);
    });

    it('should reject executable files', () => {
      expect(validateFileType('application/x-executable')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateFileType('')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under 10MB', () => {
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
    });

    it('should accept files exactly 10MB', () => {
      expect(validateFileSize(10 * 1024 * 1024)).toBe(true); // 10MB
    });

    it('should reject files over 10MB', () => {
      expect(validateFileSize(10 * 1024 * 1024 + 1)).toBe(false); // 10MB + 1 byte
    });

    it('should reject files much larger than 10MB', () => {
      expect(validateFileSize(50 * 1024 * 1024)).toBe(false); // 50MB
    });

    it('should accept zero-byte files', () => {
      expect(validateFileSize(0)).toBe(true);
    });

    it('should accept 1 byte files', () => {
      expect(validateFileSize(1)).toBe(true);
    });
  });

  describe('documentUploadSchema', () => {
    it('should accept valid document metadata', () => {
      const validData = {
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        file_size: 1024 * 1024, // 1MB
        description: 'Test document',
      };

      const result = documentUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file_name).toBe('document.pdf');
        expect(result.data.file_type).toBe('application/pdf');
        expect(result.data.file_size).toBe(1024 * 1024);
        expect(result.data.description).toBe('Test document');
      }
    });

    it('should accept document without description (optional field)', () => {
      const dataWithoutDescription = {
        file_name: 'image.png',
        file_type: 'image/png',
        file_size: 500000,
      };

      const result = documentUploadSchema.safeParse(dataWithoutDescription);
      expect(result.success).toBe(true);
    });

    it('should reject invalid file type', () => {
      const invalidType = {
        file_name: 'script.js',
        file_type: 'application/javascript',
        file_size: 1024,
      };

      const result = documentUploadSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeError = result.error.issues.find((issue) =>
          issue.path.includes('file_type')
        );
        expect(typeError).toBeDefined();
      }
    });

    it('should reject file size over 10MB', () => {
      const oversizedFile = {
        file_name: 'large.pdf',
        file_type: 'application/pdf',
        file_size: 11 * 1024 * 1024, // 11MB
      };

      const result = documentUploadSchema.safeParse(oversizedFile);
      expect(result.success).toBe(false);
      if (!result.success) {
        const sizeError = result.error.issues.find((issue) =>
          issue.path.includes('file_size')
        );
        expect(sizeError).toBeDefined();
      }
    });

    it('should reject empty file name', () => {
      const emptyFileName = {
        file_name: '',
        file_type: 'application/pdf',
        file_size: 1024,
      };

      const result = documentUploadSchema.safeParse(emptyFileName);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const missingFields = {
        description: 'Just a description',
      };

      const result = documentUploadSchema.safeParse(missingFields);
      expect(result.success).toBe(false);
    });

    it('should trim description whitespace', () => {
      const dataWithWhitespace = {
        file_name: 'doc.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        description: '  Some description  ',
      };

      const result = documentUploadSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Some description');
      }
    });
  });
});
