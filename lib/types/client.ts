/**
 * Client record from the database
 */
export interface Client {
  /** Unique identifier (CUID) */
  id: string;
  /** Client's full name */
  name: string;
  /** Client's email address */
  email: string;
  /** Client's phone number (optional) */
  phone?: string;
  /** Client's birthday in ISO 8601 format (optional) */
  birthday?: string;
  /** Client's address (optional) */
  address?: string;
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
}

/**
 * Extended client record with related data counts
 * Returned by getClientById() to include aggregated counts
 */
export interface ClientWithCounts extends Client {
  /** Number of documents attached to this client */
  documents_count: number;
  /** Number of notes recorded for this client */
  notes_count: number;
  /** Number of tasks associated with this client */
  tasks_count: number;
}

/**
 * Input data for creating a new client
 */
export interface CreateClientInput {
  /** Client's full name */
  name: string;
  /** Client's email address */
  email: string;
  /** Client's phone number (optional) */
  phone?: string;
  /** Client's birthday in ISO 8601 format (optional) */
  birthday?: string;
  /** Client's address (optional) */
  address?: string;
}

/**
 * Input data for updating an existing client
 * All fields are optional
 */
export interface UpdateClientInput {
  /** Client's full name */
  name?: string;
  /** Client's email address */
  email?: string;
  /** Client's phone number */
  phone?: string;
  /** Client's birthday in ISO 8601 format */
  birthday?: string;
  /** Client's address */
  address?: string;
}

/**
 * Parameters for listing clients with pagination and filtering
 */
export interface ListClientsParams {
  /** Cursor for pagination (CUID of last item from previous page) */
  cursor?: string;
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Search term to filter by name or email */
  search?: string;
  /** Filter by tag name */
  tag?: string;
  /** Sort order */
  sort?: 'created_at' | 'name';
}

/**
 * Paginated response for client list queries
 */
export interface PaginatedClients {
  /** Array of client records */
  data: Client[];
  /** Cursor for next page (undefined if no more pages) */
  next_cursor?: string;
  /** Total count of clients matching the query */
  total_count: number;
}

// =============================================================================
// CLIENT TAGS
// =============================================================================

/**
 * Client tag record from the database
 */
export interface ClientTag {
  /** Unique identifier (CUID) */
  id: string;
  /** ID of the client this tag belongs to */
  client_id: string;
  /** Tag label/name */
  tag_name: string;
  /** User ID who created this tag */
  created_by: string;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
}

/**
 * Input data for adding a tag to a client
 */
export interface CreateTagInput {
  /** Tag label/name */
  tag_name: string;
}

// =============================================================================
// CLIENT NOTES
// =============================================================================

/**
 * Client note record from the database
 */
export interface ClientNote {
  /** Unique identifier (CUID) */
  id: string;
  /** ID of the client this note belongs to */
  client_id: string;
  /** Note content text */
  content: string;
  /** Flag indicating if this note is important */
  is_important: boolean;
  /** User ID who created this note */
  created_by: string;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
  /** Record last update timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * Input data for creating a new note
 */
export interface CreateNoteInput {
  /** Note content text */
  content: string;
  /** Flag indicating if this note is important (default: false) */
  is_important?: boolean;
}

/**
 * Input data for updating an existing note
 */
export interface UpdateNoteInput {
  /** Note content text */
  content?: string;
  /** Flag indicating if this note is important */
  is_important?: boolean;
}

// =============================================================================
// CLIENT TASKS
// =============================================================================

/** Valid task priority values */
export type TaskPriority = 'low' | 'medium' | 'high';

/** Valid task status values */
export type TaskStatus = 'pending' | 'completed';

/**
 * Client task record from the database
 */
export interface ClientTask {
  /** Unique identifier (CUID) */
  id: string;
  /** ID of the client this task belongs to */
  client_id: string;
  /** Task title */
  title: string;
  /** Task description (optional) */
  description?: string;
  /** Task due date (ISO 8601 date format) */
  due_date: string;
  /** Task priority: low, medium, high */
  priority: TaskPriority;
  /** Task status: pending, completed */
  status: TaskStatus;
  /** Timestamp when task was completed (ISO 8601, null if not completed) */
  completed_at?: string | null;
  /** User ID who created this task */
  created_by: string;
  /** User ID who this task is assigned to */
  assigned_to: string;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
  /** Record last update timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * Task with client info for dashboard display
 */
export interface TaskWithClient extends ClientTask {
  /** Client name for display */
  client_name: string;
}

/**
 * Input data for creating a new task
 */
export interface CreateTaskInput {
  /** Task title */
  title: string;
  /** Task description (optional) */
  description?: string;
  /** Task due date (ISO 8601 date format) */
  due_date: string;
  /** Task priority: low, medium, high (default: medium) */
  priority?: TaskPriority;
}

/**
 * Input data for updating an existing task
 */
export interface UpdateTaskInput {
  /** Task title */
  title?: string;
  /** Task description */
  description?: string;
  /** Task due date (ISO 8601 date format) */
  due_date?: string;
  /** Task priority: low, medium, high */
  priority?: TaskPriority;
  /** Task status: pending, completed */
  status?: TaskStatus;
}

/**
 * Parameters for filtering tasks in dashboard
 */
export interface TaskFilters {
  /** Filter by status: pending, completed */
  status?: TaskStatus;
  /** Filter by priority: low, medium, high */
  priority?: TaskPriority;
  /** Filter tasks due before this date (ISO 8601) */
  due_before?: string;
  /** Filter tasks due after this date (ISO 8601) */
  due_after?: string;
}

// =============================================================================
// CLIENT DOCUMENTS
// =============================================================================

/**
 * Client document record from the database
 */
export interface ClientDocument {
  /** Unique identifier (CUID) */
  id: string;
  /** ID of the client this document belongs to */
  client_id: string;
  /** Original filename */
  file_name: string;
  /** Storage path in Supabase Storage */
  file_path: string;
  /** File size in bytes */
  file_size: number;
  /** MIME type of the file */
  file_type: string;
  /** Optional document description */
  description?: string;
  /** User ID who uploaded this document */
  uploaded_by: string;
  /** Record upload timestamp (ISO 8601) */
  uploaded_at: string;
}

/**
 * Document with signed download URL
 * Returned after upload or when requesting download
 */
export interface ClientDocumentWithUrl extends ClientDocument {
  /** Signed URL for downloading the document */
  download_url: string;
  /** URL expiration time in seconds */
  expires_in: number;
}

/**
 * Input data for uploading a document
 * Used for API request validation
 */
export interface CreateDocumentInput {
  /** Optional document description */
  description?: string;
}

/**
 * Response for download URL generation
 */
export interface DocumentDownloadResponse {
  /** Signed URL for downloading the document */
  url: string;
  /** URL expiration time in seconds */
  expires_in: number;
}
