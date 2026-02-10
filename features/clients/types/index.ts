/**
 * Client Hub TypeScript Types
 *
 * Re-exports core types from lib/types/client.ts and extends with
 * frontend-specific types for React components and hooks.
 *
 * @module features/clients/types
 */

// Import for local use
import type { ClientTask as ClientTaskType } from '@/lib/types/client';

// =============================================================================
// RE-EXPORT CORE TYPES
// =============================================================================

// Core entity types
export type {
  Client,
  ClientWithCounts,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
  PaginatedClients,
} from '@/lib/types/client';

// Tag types
export type { ClientTag, CreateTagInput } from '@/lib/types/client';

// Note types
export type {
  ClientNote,
  CreateNoteInput,
  UpdateNoteInput,
} from '@/lib/types/client';

// Task types
export type {
  ClientTask,
  TaskWithClient,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '@/lib/types/client';

// Document types
export type {
  ClientDocument,
  ClientDocumentWithUrl,
  CreateDocumentInput,
  DocumentDownloadResponse,
} from '@/lib/types/client';

// =============================================================================
// FRONTEND-SPECIFIC TYPES
// =============================================================================

/**
 * Client with tags for list display
 * Extended from Client to include tag names array for UI rendering
 */
export interface ClientWithTags {
  /** Unique identifier (CUID) */
  id: string;
  /** Client's full name */
  name: string;
  /** Client's email address */
  email: string;
  /** Client's phone number */
  phone?: string;
  /** Client's birthday in ISO 8601 format */
  birthday?: string;
  /** Client's address */
  address?: string;
  /** Reference to client status (optional) */
  status_id?: string;
  /** User ID who created this client */
  created_by: string;
  /** User ID who this client is assigned to */
  assigned_to: string;
  /** Soft delete flag */
  is_deleted: boolean;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
  /** Record last update timestamp (ISO 8601) */
  updated_at: string;
  /** Array of tag names for this client */
  tags: string[];
}

/**
 * Paginated response with clients including tags
 */
export interface PaginatedClientsWithTags {
  /** Array of client records with tags */
  data: ClientWithTags[];
  /** Cursor for next page (undefined if no more pages) */
  next_cursor?: string;
  /** Total count of clients matching the query */
  total_count: number;
}

/**
 * Sort options for client list
 */
export type ClientSortField = 'created_at' | 'name' | 'email' | 'updated_at';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Extended list parameters for frontend use
 */
export interface ListClientsOptions {
  /** Cursor for pagination (created_at timestamp from previous page) */
  cursor?: string;
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Search term to filter by name, email, or phone */
  search?: string;
  /** Filter by tag name */
  tag?: string;
  /** Filter by status ID */
  status?: string;
  /** Sort field */
  sortBy?: ClientSortField;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** Special filter for metrics (need-followup, birthdays-soon) */
  special_filter?: 'need-followup' | 'birthdays-soon';
}

/**
 * Client form data for create/edit forms
 * Matches the form field structure
 */
export interface ClientFormData {
  /** Client's full name */
  name: string;
  /** Client's email address */
  email: string;
  /** Client's phone number in +1-XXX-XXX-XXXX format */
  phone: string;
  /** Client's status ID (optional) */
  status_id?: string;
  /** Array of tag names (optional) */
  tags?: string[];
  /** Client's birthday (optional) */
  birthday?: string;
  /** Client's address (optional) */
  address?: string;
}

/**
 * Task form data for create/edit forms
 */
export interface TaskFormData {
  /** Task title */
  title: string;
  /** Task description (optional) */
  description?: string;
  /** Task due date in YYYY-MM-DD format */
  due_date: string;
  /** Task priority */
  priority: 'low' | 'medium' | 'high';
}

/**
 * Note form data for create/edit forms
 */
export interface NoteFormData {
  /** Note content */
  content: string;
  /** Whether the note is marked as important */
  is_important: boolean;
}

/**
 * Document upload form data
 */
export interface DocumentUploadData {
  /** The file to upload */
  file: File;
  /** Optional description */
  description?: string;
}

/**
 * Allowed document MIME types
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const;

export type AllowedDocumentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

/**
 * Maximum file size for document uploads (10MB in bytes)
 */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

/**
 * Phone number format regex
 * Format: +1-XXX-XXX-XXXX
 */
export const PHONE_FORMAT_REGEX = /^\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$/;

/**
 * Task with computed properties for UI display
 */
export interface TaskDisplayInfo {
  /** Whether the task is overdue */
  isOverdue: boolean;
  /** Whether the task is due today */
  isDueToday: boolean;
  /** Whether the task is due tomorrow */
  isDueTomorrow: boolean;
  /** Days until due (negative if overdue) */
  daysUntilDue: number;
  /** Priority color for UI */
  priorityColor: 'error' | 'warning' | 'success' | 'default';
  /** Status color for UI */
  statusColor: 'success' | 'primary' | 'default';
}

/**
 * Task with display info for rendering
 */
export interface TaskWithDisplayInfo extends TaskDisplayInfo {
  task: ClientTaskType;
}

/**
 * Client profile tab values
 */
export type ClientProfileTab = 'overview' | 'documents' | 'notes' | 'tasks' | 'deals';

/**
 * API error response structure
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code (if available) */
  code?: string;
  /** Field-specific errors for validation */
  details?: Record<string, string>;
}

/**
 * CSV import result
 */
export interface CSVImportResult {
  /** Number of successfully imported clients */
  imported: number;
  /** Number of failed imports */
  failed: number;
  /** Array of error details for failed rows */
  errors: Array<{
    /** Row number in the CSV (1-indexed) */
    row: number;
    /** Error message */
    error: string;
  }>;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Filter by tag names */
  tags?: string[];
  /** Include deleted clients */
  includeDeleted?: boolean;
}

// =============================================================================
// CSV IMPORT TYPES
// =============================================================================

/**
 * Raw data for a single row parsed from CSV
 */
export interface ImportRowData {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  tags: string;
}

/**
 * A single row from CSV import with validation state
 */
export interface ImportRow {
  /** Unique ID for React key */
  id: string;
  /** Row index (0-based, excluding header) */
  rowIndex: number;
  /** Raw data from CSV */
  data: ImportRowData;
  /** Whether this row passes validation */
  isValid: boolean;
  /** Field-level validation errors */
  errors: Partial<Record<keyof ImportRowData, string>>;
}

/**
 * Bulk import request body sent to the API
 */
export interface BulkImportRequest {
  clients: Array<{
    name: string;
    email: string;
    phone?: string;
    birthday?: string;
    address?: string;
    tags?: string[];
  }>;
}

/**
 * Import filter tab values for the review table
 */
export type ImportFilterTab = 'all' | 'valid' | 'error';

/**
 * Client needing follow-up (no notes in 30+ days)
 */
export interface ClientForFollowup {
  /** Client ID */
  id: string;
  /** Client name */
  name: string;
  /** Client email */
  email: string;
  /** Date of last note (null if no notes) */
  last_note_date: string | null;
}

/**
 * Client with upcoming birthday
 */
export interface ClientForBirthday {
  /** Client ID */
  id: string;
  /** Client name */
  name: string;
  /** Client birthday (ISO date string) */
  birthday: string;
  /** Days until birthday */
  days_until: number;
}

/**
 * Client statistics for metrics cards
 */
export interface ClientStats {
  /** Total number of clients */
  total_clients: number;
  /** Clients added this month */
  new_this_month: number;
  /** Clients needing follow-up */
  need_followup: {
    /** Count of clients needing follow-up */
    count: number;
    /** List of clients (limited to 10) */
    clients: ClientForFollowup[];
  };
  /** Clients with birthdays in next 30 days */
  birthdays_soon: {
    /** Count of clients with upcoming birthdays */
    count: number;
    /** List of clients (limited to 10) */
    clients: ClientForBirthday[];
  };
}
