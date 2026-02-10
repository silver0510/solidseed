/**
 * CSV Import Validation
 *
 * Validates individual rows and entire batches of CSV import data.
 * Reuses existing validation patterns from the client form schema.
 *
 * @module features/clients/utils/csvValidation
 */

import type { ImportRow, ImportRowData } from '../types';

// =============================================================================
// VALIDATION HELPERS (reused from clientFormSchema patterns)
// =============================================================================

/**
 * Phone number regex - accepts flexible US phone formats
 */
const phoneRegex =
  /^(\+?1)?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/;

/**
 * Email regex for basic validation
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if a date string represents a date in the past
 */
function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date string is a valid date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// =============================================================================
// ROW VALIDATION
// =============================================================================

/**
 * Validate a single import row and return field-level errors
 */
export function validateImportRow(
  data: ImportRowData
): Partial<Record<keyof ImportRowData, string>> {
  const errors: Partial<Record<keyof ImportRowData, string>> = {};

  // Name: required
  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  }

  // Email: required + format
  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'Invalid email format. Please enter a valid email address.';
  }

  // Phone: optional, but if provided must be valid US phone
  if (data.phone.trim() && !phoneRegex.test(data.phone.trim())) {
    errors.phone = 'Invalid phone. Enter a 10-digit US number (e.g., 5551234567).';
  }

  // Birthday: optional, but if provided must be valid date in the past
  if (data.birthday.trim()) {
    if (!isValidDateFormat(data.birthday.trim())) {
      errors.birthday = 'Invalid date format. Use YYYY-MM-DD.';
    } else if (!isPastDate(data.birthday.trim())) {
      errors.birthday = 'Birthday must be in the past.';
    }
  }

  return errors;
}

// =============================================================================
// BULK VALIDATION
// =============================================================================

/**
 * Generate a unique ID for an import row
 */
let rowIdCounter = 0;
export function generateRowId(): string {
  rowIdCounter += 1;
  return `import-row-${rowIdCounter}-${Date.now()}`;
}

/**
 * Reset the row ID counter (useful for new imports)
 */
export function resetRowIdCounter(): void {
  rowIdCounter = 0;
}

/**
 * Validate all import rows and check for duplicate emails within the batch
 *
 * @param rows - Array of raw CSV row data
 * @returns Array of ImportRow with validation state
 */
export function validateAllRows(rows: ImportRowData[]): ImportRow[] {
  resetRowIdCounter();

  // First pass: per-row validation
  const importRows: ImportRow[] = rows.map((data, index) => {
    const errors = validateImportRow(data);
    return {
      id: generateRowId(),
      rowIndex: index,
      data,
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  });

  // Second pass: check for duplicate emails within the CSV
  const emailCount = new Map<string, number[]>();
  importRows.forEach((row, index) => {
    const email = row.data.email.trim().toLowerCase();
    if (email) {
      const indices = emailCount.get(email) || [];
      indices.push(index);
      emailCount.set(email, indices);
    }
  });

  emailCount.forEach((indices) => {
    if (indices.length > 1) {
      // Mark all duplicates except the first occurrence
      for (let i = 1; i < indices.length; i++) {
        const row = importRows[indices[i]!];
        if (row) {
          row.errors.email = `Duplicate email. Same as row ${(indices[0]! + 1)}.`;
          row.isValid = false;
        }
      }
    }
  });

  return importRows;
}

/**
 * Re-validate a single row (used when editing inline)
 * Also checks for duplicates against all other rows
 */
export function revalidateRow(
  row: ImportRow,
  allRows: ImportRow[]
): ImportRow {
  const errors = validateImportRow(row.data);

  // Check for duplicate email against other rows
  const email = row.data.email.trim().toLowerCase();
  if (email) {
    const duplicate = allRows.find(
      (other) =>
        other.id !== row.id &&
        other.data.email.trim().toLowerCase() === email
    );
    if (duplicate) {
      errors.email = `Duplicate email. Same as row ${duplicate.rowIndex + 1}.`;
    }
  }

  return {
    ...row,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Create a new empty import row
 */
export function createEmptyRow(rowIndex: number): ImportRow {
  return {
    id: generateRowId(),
    rowIndex,
    data: {
      name: '',
      email: '',
      phone: '',
      birthday: '',
      address: '',
      tags: '',
    },
    isValid: false,
    errors: {
      name: 'Name is required.',
      email: 'Email is required.',
    },
  };
}
