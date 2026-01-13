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
