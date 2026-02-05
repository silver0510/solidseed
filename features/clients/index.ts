/**
 * Client Hub Feature
 *
 * Centralized client management for Korella CRM.
 * Provides API services, types, and utilities for managing clients,
 * tags, notes, tasks, and documents.
 *
 * @module features/clients
 *
 * @example
 * ```typescript
 * // Import API methods
 * import { clientApi, tagApi, noteApi, taskApi, documentApi } from '@/features/clients';
 *
 * // Import types
 * import type { Client, ClientTask, CreateClientInput } from '@/features/clients';
 *
 * // Import query keys for React Query
 * import { clientQueryKeys, taskQueryKeys } from '@/features/clients';
 *
 * // Import helper utilities
 * import { formatPhoneNumber, getTaskDisplayInfo } from '@/features/clients';
 * ```
 */

// =============================================================================
// API EXPORTS
// =============================================================================

export {
  // Client CRUD operations
  clientApi,
  // Tag management
  tagApi,
  // Note management
  noteApi,
  // Task management
  taskApi,
  // Document management
  documentApi,
  // React Query keys
  clientQueryKeys,
  tagQueryKeys,
  noteQueryKeys,
  taskQueryKeys,
  documentQueryKeys,
} from './api/clientApi';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Core entity types
export type {
  Client,
  ClientWithCounts,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
  PaginatedClients,
} from './types';

// Tag types
export type { ClientTag, CreateTagInput } from './types';

// Note types
export type { ClientNote, CreateNoteInput, UpdateNoteInput } from './types';

// Task types
export type {
  ClientTask,
  TaskWithClient,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from './types';

// Document types
export type {
  ClientDocument,
  ClientDocumentWithUrl,
  CreateDocumentInput,
  DocumentDownloadResponse,
} from './types';

// Frontend-specific types
export type {
  ClientWithTags,
  PaginatedClientsWithTags,
  ClientSortField,
  SortDirection,
  ListClientsOptions,
  ClientFormData,
  TaskFormData,
  NoteFormData,
  DocumentUploadData,
  AllowedDocumentType,
  TaskDisplayInfo,
  TaskWithDisplayInfo,
  ClientProfileTab,
  ApiError,
  CSVImportResult,
  CSVExportOptions,
  ClientForFollowup,
  ClientForBirthday,
  ClientStats,
} from './types';

// Constants
export {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
  PHONE_FORMAT_REGEX,
} from './types';

// =============================================================================
// HELPER EXPORTS
// =============================================================================

export {
  // Phone formatting
  formatPhoneNumber,
  isValidPhoneFormat,
  formatPhoneForDisplay,
  // Date formatting
  formatDate,
  formatDateTime,
  formatRelativeTime,
  isToday,
  isTomorrow,
  isPast,
  daysUntil,
  // Task helpers
  getTaskDisplayInfo,
  getPriorityColor,
  getPriorityLabel,
  getStatusLabel,
  sortTasksByUrgency,
  // Document helpers
  isAllowedDocumentType,
  isValidDocumentSize,
  formatFileSize,
  getFileExtension,
  getFileTypeName,
  // Validation helpers
  isValidEmail,
  isNotEmpty,
  isValidBirthday,
  // String helpers
  truncateText,
  getInitials,
  highlightSearchTerm,
} from './helpers';

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

// Client List
export { ClientList } from './components/ClientList';
export { ClientCard } from './components/ClientList';
export type { ClientListProps, ClientCardProps } from './components/ClientList';

// Client Form
export { ClientForm } from './components/ClientForm';
export type { ClientFormProps } from './components/ClientForm';

// Client Profile
export { ClientProfile } from './components/ClientProfile';
export { OverviewTab, DocumentsTab, NotesTab, TasksTab } from './components/ClientProfile';
export type {
  ClientProfileProps,
  OverviewTabProps,
  DocumentsTabProps,
  NotesTabProps,
  TasksTabProps,
} from './components/ClientProfile';

// Document Uploader
export { DocumentUploader, DocumentList } from './components/DocumentUploader';
export type { DocumentUploaderProps, DocumentListProps } from './components/DocumentUploader';

// Note Editor
export { NoteEditor, NoteList } from './components/NoteEditor';
export type { NoteEditorProps, NoteListProps } from './components/NoteEditor';

// Task Card
export { TaskCard, TaskList } from './components/TaskCard';
export type { TaskCardProps, TaskListProps } from './components/TaskCard';

// Task Dashboard
export { TaskDashboard, TaskGroup } from './components/TaskDashboard';
export type { TaskDashboardProps, TaskGroupProps } from './components/TaskDashboard';

// Client Deals Widget
export { ClientDealsWidget } from './components/ClientDealsWidget';
export type { ClientDealsWidgetProps } from './components/ClientDealsWidget';

// Deal Badge
export { DealBadge } from './components/DealBadge';
export type { DealBadgeProps } from './components/DealBadge';

// Metric Sheets
export { NeedFollowupSheet } from './components/NeedFollowupSheet';
export { BirthdaysSoonSheet } from './components/BirthdaysSoonSheet';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

export { useClient } from './hooks/useClient';
export { useClientsInfinite } from './hooks/useClientsInfinite';
export type { SpecialFilter } from './hooks/useClientsInfinite';
export { useDocumentUpload } from './hooks/useDocumentUpload';
export { useAllTasks } from './hooks/useAllTasks';
export { useClientDeals } from './hooks/useClientDeals';
export type { UseClientDealsOptions, UseClientDealsReturn, ClientDeal, DealStatus } from './hooks/useClientDeals';
