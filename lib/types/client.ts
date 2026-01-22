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
  /** Array of tag names associated with this client */
  tags?: string[];
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
  /** Reference to client status (optional) */
  status_id?: string;
  /** Array of tag names (optional) */
  tags?: string[];
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
  /** Reference to client status */
  status_id?: string;
  /** Array of tag names */
  tags?: string[];
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
  /** Filter by status ID */
  status?: string;
  /** Sort order */
  sort?: 'created_at' | 'name' | 'updated_at';
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
export type TaskStatus = 'todo' | 'in_progress' | 'closed';

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
  /** Task status: todo, in_progress, closed */
  status: TaskStatus;
  /** Timestamp when task was closed (ISO 8601, null if not closed) */
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
  /** Task status: todo, in_progress, closed */
  status?: TaskStatus;
  /** Client ID to reassign the task to (optional) */
  client_id?: string;
}

/**
 * Parameters for filtering tasks in dashboard
 */
export interface TaskFilters {
  /** Filter by status: todo, in_progress, closed */
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

// =============================================================================
// CLIENT STATUSES
// =============================================================================

/**
 * Client status record from the database
 */
export interface ClientStatus {
  /** Unique identifier (UUID) */
  id: string;
  /** User ID who owns this status */
  user_id: string;
  /** Status name/label */
  name: string;
  /** Status color (from preset palette) */
  color: string;
  /** Display order position */
  position: number;
  /** Whether this is a default status (cannot be deleted) */
  is_default: boolean;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
  /** Record last update timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * Input data for creating a new client status
 */
export interface CreateClientStatusInput {
  /** Status name/label */
  name: string;
  /** Status color (from preset palette) */
  color: string;
  /** Display order position (optional, defaults to last) */
  position?: number;
}

/**
 * Input data for updating an existing client status
 */
export interface UpdateClientStatusInput {
  /** Status name/label */
  name?: string;
  /** Status color (from preset palette) */
  color?: string;
  /** Display order position */
  position?: number;
}

// =============================================================================
// USER TAGS (Tag Templates)
// =============================================================================

/**
 * User tag template record from the database
 */
export interface UserTag {
  /** Unique identifier (UUID) */
  id: string;
  /** User ID who owns this tag */
  user_id: string;
  /** Tag name/label */
  name: string;
  /** Tag color (from preset palette) */
  color: string;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
}

/**
 * Input data for creating a new user tag
 */
export interface CreateUserTagInput {
  /** Tag name/label */
  name: string;
  /** Tag color (from preset palette) */
  color: string;
}

/**
 * Input data for updating an existing user tag
 */
export interface UpdateUserTagInput {
  /** Tag name/label */
  name?: string;
  /** Tag color (from preset palette) */
  color?: string;
}

// =============================================================================
// ACTIVITY LOGS
// =============================================================================

/** Valid activity types */
export type ActivityType =
  | 'client.created'
  | 'client.updated'
  | 'client.status_changed'
  | 'task.created'
  | 'task.completed'
  | 'note.created'
  | 'document.uploaded'
  | 'document.downloaded'
  | 'tag.added'
  | 'tag.removed';

/** Valid entity types for activity logs */
export type EntityType = 'client' | 'task' | 'note' | 'document' | 'tag';

/**
 * Activity log record from the database
 */
export interface ActivityLog {
  /** Unique identifier (UUID) */
  id: string;
  /** User ID who performed the activity */
  user_id: string;
  /** Type of activity performed */
  activity_type: ActivityType;
  /** Type of entity affected */
  entity_type: EntityType;
  /** ID of the affected entity */
  entity_id: string;
  /** Associated client ID (for context) */
  client_id?: string;
  /** Additional metadata (old_status, new_status, client_name, etc.) */
  metadata?: Record<string, unknown>;
  /** Record creation timestamp (ISO 8601) */
  created_at: string;
}

/**
 * Activity log with client info for display
 */
export interface ActivityLogWithClient extends ActivityLog {
  /** Client name for display */
  client_name?: string;
}

/**
 * Input data for creating an activity log
 */
export interface CreateActivityLogInput {
  /** Type of activity performed */
  activity_type: ActivityType;
  /** Type of entity affected */
  entity_type: EntityType;
  /** ID of the affected entity */
  entity_id: string;
  /** Associated client ID (for context) */
  client_id?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for listing activity logs
 */
export interface ListActivityLogsParams {
  /** Filter by client ID */
  client_id?: string;
  /** Filter by activity type */
  activity_type?: ActivityType;
  /** Limit number of results (default: 10, max: 100) */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Paginated response for activity log list queries
 */
export interface PaginatedActivityLogs {
  /** Array of activity log records */
  data: ActivityLogWithClient[];
  /** Cursor for next page (undefined if no more pages) */
  next_cursor?: string;
  /** Total count of activities matching the query */
  total_count: number;
}
