/**
 * CSV Template Utilities
 *
 * Provides CSV template generation, download, and parsing for client import.
 * Uses PapaParse for CSV operations.
 *
 * @module features/clients/utils/csvTemplate
 */

import Papa from 'papaparse';
import type { ImportRowData } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * CSV template column headers matching the client schema
 */
export const CSV_TEMPLATE_HEADERS: (keyof ImportRowData)[] = [
  'name',
  'email',
  'phone',
  'birthday',
  'address',
  'tags',
];

/**
 * Display-friendly column labels for the CSV template header row
 */
export const CSV_COLUMN_LABELS: Record<keyof ImportRowData, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  birthday: 'Birthday',
  address: 'Address',
  tags: 'Tags',
};

/**
 * Maximum number of rows allowed per import
 */
export const MAX_IMPORT_ROWS = 500;

// =============================================================================
// CSV TEMPLATE DOWNLOAD
// =============================================================================

/**
 * Generate and download a CSV template file with headers and example rows
 */
export function downloadCSVTemplate(): void {
  const exampleRows = [
    {
      Name: 'John Doe',
      Email: 'john.doe@example.com',
      Phone: '5551234567',
      Birthday: '1990-05-15',
      Address: '123 Main St, Dallas, TX 75001',
      Tags: 'Buyer, VIP',
    },
    {
      Name: 'Jane Smith',
      Email: 'jane.smith@example.com',
      Phone: '5559876543',
      Birthday: '1985-11-20',
      Address: '456 Oak Ave, Austin, TX 73301',
      Tags: 'Seller',
    },
  ];

  const csv = Papa.unparse(exampleRows);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'client-import-template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// CSV PARSING
// =============================================================================

/**
 * Normalize a CSV header to match ImportRowData keys
 * Handles case-insensitive matching and common variations
 */
function normalizeHeader(header: string): string {
  const trimmed = header.trim().toLowerCase();
  const mapping: Record<string, keyof ImportRowData> = {
    name: 'name',
    'full name': 'name',
    fullname: 'name',
    email: 'email',
    'email address': 'email',
    phone: 'phone',
    'phone number': 'phone',
    telephone: 'phone',
    birthday: 'birthday',
    'date of birth': 'birthday',
    dob: 'birthday',
    address: 'address',
    tags: 'tags',
    tag: 'tags',
  };
  return mapping[trimmed] || trimmed;
}

/**
 * Parse a CSV file and return typed row data
 *
 * @param file - The CSV file to parse
 * @returns Promise resolving to parsed rows
 * @throws Error if CSV is malformed, has wrong headers, or exceeds row limit
 */
export function parseCSVFile(
  file: File
): Promise<{ rows: ImportRowData[]; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Please upload a CSV file (.csv)'));
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        const warnings: string[] = [];

        // Check for parse errors
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (e) => e.type !== 'FieldMismatch'
          );
          if (criticalErrors.length > 0) {
            reject(
              new Error(
                `CSV parsing error: ${criticalErrors[0]?.message || 'Unknown error'}`
              )
            );
            return;
          }
          // Field mismatch warnings (extra/missing columns)
          warnings.push(
            'Some rows have a different number of columns than the header.'
          );
        }

        // Validate required headers exist
        const headers = results.meta.fields?.map((h) => h.toLowerCase()) || [];
        const hasName = headers.includes('name');
        const hasEmail = headers.includes('email');

        if (!hasName || !hasEmail) {
          const missing = [];
          if (!hasName) missing.push('Name');
          if (!hasEmail) missing.push('Email');
          reject(
            new Error(
              `Missing required columns: ${missing.join(', ')}. Please use the template.`
            )
          );
          return;
        }

        // Check row count
        if (results.data.length === 0) {
          reject(new Error('CSV file is empty. Please add at least one row.'));
          return;
        }

        if (results.data.length > MAX_IMPORT_ROWS) {
          reject(
            new Error(
              `CSV has ${results.data.length} rows. Maximum is ${MAX_IMPORT_ROWS} rows per import.`
            )
          );
          return;
        }

        // Map to typed rows
        const rows: ImportRowData[] = results.data.map((row) => ({
          name: (row.name || '').trim(),
          email: (row.email || '').trim(),
          phone: (row.phone || '').trim(),
          birthday: (row.birthday || '').trim(),
          address: (row.address || '').trim(),
          tags: (row.tags || '').trim(),
        }));

        resolve({ rows, warnings });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}
