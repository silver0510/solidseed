/**
 * Client API Service Layer
 *
 * Provides a clean API interface for frontend components and React Query hooks.
 * Wraps the underlying service classes and provides typed methods for all
 * client-related operations.
 *
 * @module features/clients/api
 */

import { ClientService } from '@/services/ClientService';
import { TagService } from '@/services/TagService';
import { NoteService } from '@/services/NoteService';
import { TaskService } from '@/services/TaskService';
import { DocumentService } from '@/services/DocumentService';

import type {
  Client,
  ClientWithCounts,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
  PaginatedClients,
  ClientTag,
  CreateTagInput,
  ClientNote,
  CreateNoteInput,
  UpdateNoteInput,
  ClientTask,
  TaskWithClient,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  ClientDocument,
  DocumentDownloadResponse,
} from '../types';

// =============================================================================
// SERVICE INSTANCES
// =============================================================================

/** Singleton instance of ClientService */
let clientServiceInstance: ClientService | null = null;

/** Singleton instance of TagService */
let tagServiceInstance: TagService | null = null;

/** Singleton instance of NoteService */
let noteServiceInstance: NoteService | null = null;

/** Singleton instance of TaskService */
let taskServiceInstance: TaskService | null = null;

/** Singleton instance of DocumentService */
let documentServiceInstance: DocumentService | null = null;

/**
 * Get or create ClientService instance
 */
function getClientService(): ClientService {
  if (!clientServiceInstance) {
    clientServiceInstance = new ClientService();
  }
  return clientServiceInstance;
}

/**
 * Get or create TagService instance
 */
function getTagService(): TagService {
  if (!tagServiceInstance) {
    tagServiceInstance = new TagService();
  }
  return tagServiceInstance;
}

/**
 * Get or create NoteService instance
 */
function getNoteService(): NoteService {
  if (!noteServiceInstance) {
    noteServiceInstance = new NoteService();
  }
  return noteServiceInstance;
}

/**
 * Get or create TaskService instance
 */
function getTaskService(): TaskService {
  if (!taskServiceInstance) {
    taskServiceInstance = new TaskService();
  }
  return taskServiceInstance;
}

/**
 * Get or create DocumentService instance
 */
function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService();
  }
  return documentServiceInstance;
}

// =============================================================================
// CLIENT API
// =============================================================================

/**
 * Client API methods for CRUD operations
 */
export const clientApi = {
  /**
   * Create a new client
   *
   * @param data - Client data to create
   * @returns Promise<Client> The created client record
   * @throws {Error} If user is not authenticated or validation fails
   */
  createClient: async (data: CreateClientInput): Promise<Client> => {
    return getClientService().createClient(data);
  },

  /**
   * List clients with pagination and filtering
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<PaginatedClients> Paginated client list
   */
  listClients: async (params: ListClientsParams = {}): Promise<PaginatedClients> => {
    return getClientService().listClients(params);
  },

  /**
   * Get a single client by ID with related counts
   *
   * @param id - The client ID
   * @returns Promise<ClientWithCounts | null> The client or null if not found
   */
  getClient: async (id: string): Promise<ClientWithCounts | null> => {
    return getClientService().getClientById(id);
  },

  /**
   * Update a client
   *
   * @param id - The client ID
   * @param data - Partial client data to update
   * @returns Promise<Client | null> The updated client or null if not found
   */
  updateClient: async (id: string, data: UpdateClientInput): Promise<Client | null> => {
    return getClientService().updateClient(id, data);
  },

  /**
   * Soft delete a client
   *
   * @param id - The client ID
   * @returns Promise<boolean> True if deletion succeeded
   */
  deleteClient: async (id: string): Promise<boolean> => {
    return getClientService().softDeleteClient(id);
  },

  /**
   * Search clients by name or email
   *
   * @param query - Search query string
   * @param limit - Maximum results to return (default: 10)
   * @returns Promise<Client[]> Array of matching clients
   */
  searchClients: async (query: string, limit: number = 10): Promise<Client[]> => {
    const result = await getClientService().listClients({
      search: query,
      limit,
    });
    return result.data;
  },
};

// =============================================================================
// TAG API
// =============================================================================

/**
 * Tag API methods for managing client tags
 */
export const tagApi = {
  /**
   * Add a tag to a client
   *
   * @param clientId - The client ID
   * @param data - Tag data
   * @returns Promise<ClientTag> The created tag
   */
  addTag: async (clientId: string, data: CreateTagInput): Promise<ClientTag> => {
    return getTagService().addTag(clientId, data);
  },

  /**
   * Remove a tag from a client
   *
   * @param clientId - The client ID the tag belongs to
   * @param tagId - The tag ID
   * @returns Promise<boolean> True if deletion succeeded
   */
  removeTag: async (clientId: string, tagId: string): Promise<boolean> => {
    return getTagService().removeTag(clientId, tagId);
  },

  /**
   * Get tag suggestions for autocomplete
   *
   * @param query - Search query to filter tags
   * @returns Promise<string[]> Array of unique tag names
   */
  getTagAutocomplete: async (query: string): Promise<string[]> => {
    return getTagService().getTagAutocomplete(query);
  },
};

// =============================================================================
// NOTE API
// =============================================================================

/**
 * Note API methods for managing client notes
 */
export const noteApi = {
  /**
   * Get all notes for a client
   *
   * @param clientId - The client ID
   * @returns Promise<ClientNote[]> Array of notes (most recent first)
   */
  getClientNotes: async (clientId: string): Promise<ClientNote[]> => {
    return getNoteService().getNotesByClient(clientId);
  },

  /**
   * Create a new note for a client
   *
   * @param clientId - The client ID
   * @param data - Note data
   * @returns Promise<ClientNote> The created note
   */
  createNote: async (clientId: string, data: CreateNoteInput): Promise<ClientNote> => {
    return getNoteService().addNote(clientId, data);
  },

  /**
   * Update a note
   *
   * @param clientId - The client ID the note belongs to
   * @param noteId - The note ID
   * @param data - Partial note data to update
   * @returns Promise<ClientNote> The updated note
   */
  updateNote: async (
    clientId: string,
    noteId: string,
    data: UpdateNoteInput
  ): Promise<ClientNote> => {
    return getNoteService().updateNote(clientId, noteId, data);
  },

  /**
   * Delete a note
   *
   * @param clientId - The client ID the note belongs to
   * @param noteId - The note ID
   * @returns Promise<boolean> True if deletion succeeded
   */
  deleteNote: async (clientId: string, noteId: string): Promise<boolean> => {
    return getNoteService().deleteNote(clientId, noteId);
  },
};

// =============================================================================
// TASK API
// =============================================================================

/**
 * Task API methods for managing client tasks
 */
export const taskApi = {
  /**
   * Get all tasks for a client
   *
   * @param clientId - The client ID
   * @returns Promise<ClientTask[]> Array of tasks
   */
  getClientTasks: async (clientId: string): Promise<ClientTask[]> => {
    return getTaskService().getTasksByClient(clientId);
  },

  /**
   * Create a new task for a client
   *
   * @param clientId - The client ID
   * @param data - Task data
   * @returns Promise<ClientTask> The created task
   */
  createTask: async (clientId: string, data: CreateTaskInput): Promise<ClientTask> => {
    return getTaskService().addTask(clientId, data);
  },

  /**
   * Update a task
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID
   * @param data - Partial task data to update
   * @returns Promise<ClientTask> The updated task
   */
  updateTask: async (
    clientId: string,
    taskId: string,
    data: UpdateTaskInput
  ): Promise<ClientTask> => {
    return getTaskService().updateTask(clientId, taskId, data);
  },

  /**
   * Delete a task
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID
   * @returns Promise<boolean> True if deletion succeeded
   */
  deleteTask: async (clientId: string, taskId: string): Promise<boolean> => {
    return getTaskService().deleteTask(clientId, taskId);
  },

  /**
   * Mark a task as complete
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID
   * @returns Promise<ClientTask> The updated task
   */
  completeTask: async (clientId: string, taskId: string): Promise<ClientTask> => {
    return getTaskService().updateTask(clientId, taskId, { status: 'completed' });
  },

  /**
   * Mark a task as pending (uncomplete)
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID
   * @returns Promise<ClientTask> The updated task
   */
  uncompleteTask: async (clientId: string, taskId: string): Promise<ClientTask> => {
    return getTaskService().updateTask(clientId, taskId, { status: 'pending' });
  },

  /**
   * Get all tasks for the current user (task dashboard)
   *
   * @param filters - Optional filters for status, priority, due date
   * @returns Promise<TaskWithClient[]> Array of tasks with client info
   */
  getUserTasks: async (filters?: TaskFilters): Promise<TaskWithClient[]> => {
    return getTaskService().getTasksByAgent(filters);
  },
};

// =============================================================================
// DOCUMENT API
// =============================================================================

/**
 * Document API methods for managing client documents
 */
export const documentApi = {
  /**
   * Get all documents for a client
   *
   * @param clientId - The client ID
   * @returns Promise<ClientDocument[]> Array of documents (most recent first)
   */
  getClientDocuments: async (clientId: string): Promise<ClientDocument[]> => {
    return getDocumentService().getDocumentsByClient(clientId);
  },

  /**
   * Get a single document by ID
   *
   * @param clientId - The client ID the document belongs to
   * @param documentId - The document ID
   * @returns Promise<ClientDocument | null> The document or null if not found
   */
  getDocument: async (
    clientId: string,
    documentId: string
  ): Promise<ClientDocument | null> => {
    return getDocumentService().getDocumentById(clientId, documentId);
  },

  /**
   * Upload a document for a client
   *
   * @param clientId - The client ID
   * @param file - The file to upload
   * @param description - Optional description
   * @returns Promise<ClientDocument> The created document
   */
  uploadDocument: async (
    clientId: string,
    file: File,
    description?: string
  ): Promise<ClientDocument> => {
    return getDocumentService().uploadDocument(clientId, file, description);
  },

  /**
   * Get a signed download URL for a document
   *
   * @param filePath - The storage path of the document
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise<DocumentDownloadResponse> Object with URL and expiration
   */
  getDownloadUrl: async (
    filePath: string,
    expiresIn: number = 3600
  ): Promise<DocumentDownloadResponse> => {
    const url = await getDocumentService().getDownloadUrl(filePath, expiresIn);
    return {
      url,
      expires_in: expiresIn,
    };
  },

  /**
   * Delete a document
   *
   * @param documentId - The document ID
   * @param filePath - The storage path of the document
   * @returns Promise<void>
   */
  deleteDocument: async (documentId: string, filePath: string): Promise<void> => {
    return getDocumentService().deleteDocument(documentId, filePath);
  },
};

// =============================================================================
// QUERY KEYS
// =============================================================================

/**
 * Query keys for React Query caching
 * Use these keys for consistent cache management across the application
 */
export const clientQueryKeys = {
  /** Base key for all client queries */
  all: ['clients'] as const,

  /** Key for client list queries */
  lists: () => [...clientQueryKeys.all, 'list'] as const,

  /** Key for filtered client list */
  list: (params: Record<string, unknown>) => [...clientQueryKeys.lists(), params] as const,

  /** Key for single client queries */
  details: () => [...clientQueryKeys.all, 'detail'] as const,

  /** Key for single client by ID */
  detail: (id: string) => [...clientQueryKeys.details(), id] as const,

  /** Key for client search queries */
  search: (query: string) => [...clientQueryKeys.all, 'search', query] as const,
};

/**
 * Query keys for tag queries
 */
export const tagQueryKeys = {
  /** Base key for all tag queries */
  all: ['tags'] as const,

  /** Key for client tags */
  byClient: (clientId: string) => [...tagQueryKeys.all, 'client', clientId] as const,

  /** Key for tag autocomplete */
  autocomplete: (query: string) => [...tagQueryKeys.all, 'autocomplete', query] as const,
};

/**
 * Query keys for note queries
 */
export const noteQueryKeys = {
  /** Base key for all note queries */
  all: ['notes'] as const,

  /** Key for client notes */
  byClient: (clientId: string) => [...noteQueryKeys.all, 'client', clientId] as const,
};

/**
 * Query keys for task queries
 */
export const taskQueryKeys = {
  /** Base key for all task queries */
  all: ['tasks'] as const,

  /** Key for client tasks */
  byClient: (clientId: string) => [...taskQueryKeys.all, 'client', clientId] as const,

  /** Key for user's task dashboard */
  dashboard: (filters?: TaskFilters) => [...taskQueryKeys.all, 'dashboard', filters] as const,
};

/**
 * Query keys for document queries
 */
export const documentQueryKeys = {
  /** Base key for all document queries */
  all: ['documents'] as const,

  /** Key for client documents */
  byClient: (clientId: string) => [...documentQueryKeys.all, 'client', clientId] as const,

  /** Key for single document by ID */
  detail: (clientId: string, documentId: string) =>
    [...documentQueryKeys.all, 'detail', clientId, documentId] as const,
};
