/**
 * Client API Service Layer
 *
 * Provides a clean API interface for frontend components and React Query hooks.
 * All client operations go through API routes (not direct Supabase access).
 *
 * @module features/clients/api
 */

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
import type { Deal } from '@/features/deals/types';
import { getBaseUrl, handleResponse, buildQueryString } from '@/lib/api/utils';

// =============================================================================
// CLIENT API
// =============================================================================

/**
 * Client API methods for CRUD operations
 * All requests go through API routes with Better Auth session validation
 */
export const clientApi = {
  /**
   * Create a new client
   */
  createClient: async (data: CreateClientInput): Promise<Client> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for session
    });
    return handleResponse<Client>(response);
  },

  /**
   * List clients with pagination and filtering
   */
  listClients: async (params: ListClientsParams = {}): Promise<PaginatedClients> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients${queryString}`, {
      credentials: 'include',
    });
    return handleResponse<PaginatedClients>(response);
  },

  /**
   * Get a single client by ID with related counts
   */
  getClient: async (id: string): Promise<ClientWithCounts | null> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${id}`, {
      credentials: 'include',
    });
    if (response.status === 404) {
      return null;
    }
    return handleResponse<ClientWithCounts>(response);
  },

  /**
   * Update a client
   */
  updateClient: async (id: string, data: UpdateClientInput): Promise<Client | null> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (response.status === 404) {
      return null;
    }
    return handleResponse<Client>(response);
  },

  /**
   * Soft delete a client
   */
  deleteClient: async (id: string): Promise<boolean> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  },

  /**
   * Search clients by name or email
   */
  searchClients: async (query: string, limit: number = 10): Promise<Client[]> => {
    const result = await clientApi.listClients({ search: query, limit });
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
   */
  addTag: async (clientId: string, data: CreateTagInput): Promise<ClientTag> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<ClientTag>(response);
  },

  /**
   * Remove a tag from a client
   */
  removeTag: async (clientId: string, tagId: string): Promise<boolean> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tags/${tagId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  },

  /**
   * Get tag suggestions for autocomplete
   */
  getTagAutocomplete: async (query: string): Promise<string[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/tags/autocomplete${buildQueryString({ q: query })}`, {
      credentials: 'include',
    });
    return handleResponse<string[]>(response);
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
   */
  getClientNotes: async (clientId: string): Promise<ClientNote[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/notes`, {
      credentials: 'include',
    });
    return handleResponse<ClientNote[]>(response);
  },

  /**
   * Create a new note for a client
   */
  createNote: async (clientId: string, data: CreateNoteInput): Promise<ClientNote> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<ClientNote>(response);
  },

  /**
   * Update a note
   */
  updateNote: async (
    clientId: string,
    noteId: string,
    data: UpdateNoteInput
  ): Promise<ClientNote> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<ClientNote>(response);
  },

  /**
   * Delete a note
   */
  deleteNote: async (clientId: string, noteId: string): Promise<boolean> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
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
   */
  getClientTasks: async (clientId: string): Promise<ClientTask[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tasks`, {
      credentials: 'include',
    });
    return handleResponse<ClientTask[]>(response);
  },

  /**
   * Create a new task for a client
   */
  createTask: async (clientId: string, data: CreateTaskInput): Promise<ClientTask> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<ClientTask>(response);
  },

  /**
   * Update a task
   */
  updateTask: async (
    clientId: string,
    taskId: string,
    data: UpdateTaskInput
  ): Promise<ClientTask> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<ClientTask>(response);
  },

  /**
   * Delete a task
   */
  deleteTask: async (clientId: string, taskId: string): Promise<boolean> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  },

  /**
   * Set task status to in_progress
   */
  startTask: async (clientId: string, taskId: string): Promise<ClientTask> => {
    return taskApi.updateTask(clientId, taskId, { status: 'in_progress' });
  },

  /**
   * Close a task (mark as done)
   */
  closeTask: async (clientId: string, taskId: string): Promise<ClientTask> => {
    return taskApi.updateTask(clientId, taskId, { status: 'closed' });
  },

  /**
   * Reopen a closed task (back to todo)
   */
  reopenTask: async (clientId: string, taskId: string): Promise<ClientTask> => {
    return taskApi.updateTask(clientId, taskId, { status: 'todo' });
  },

  /**
   * Get all tasks for the current user (task dashboard)
   */
  getUserTasks: async (filters?: TaskFilters): Promise<TaskWithClient[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/agent/tasks${buildQueryString(filters as Record<string, unknown> || {})}`, {
      credentials: 'include',
    });
    const result = await handleResponse<{ tasks: TaskWithClient[] }>(response);
    return result.tasks;
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
   */
  getClientDocuments: async (clientId: string): Promise<ClientDocument[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/documents`, {
      credentials: 'include',
    });
    return handleResponse<ClientDocument[]>(response);
  },

  /**
   * Get a single document by ID
   */
  getDocument: async (
    clientId: string,
    documentId: string
  ): Promise<ClientDocument | null> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/documents/${documentId}`, {
      credentials: 'include',
    });
    if (response.status === 404) {
      return null;
    }
    return handleResponse<ClientDocument>(response);
  },

  /**
   * Upload a document for a client
   */
  uploadDocument: async (
    clientId: string,
    file: File,
    description?: string
  ): Promise<ClientDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return handleResponse<ClientDocument>(response);
  },

  /**
   * Get a signed download URL for a document
   */
  getDownloadUrl: async (
    clientId: string,
    documentId: string
  ): Promise<DocumentDownloadResponse> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/documents/${documentId}/download`, {
      credentials: 'include',
    });
    return handleResponse<DocumentDownloadResponse>(response);
  },

  /**
   * Delete a document
   */
  deleteDocument: async (clientId: string, documentId: string): Promise<boolean> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/clients/${clientId}/documents/${documentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
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

// =============================================================================
// DEAL API
// =============================================================================

/**
 * Deal API methods for managing client deals
 */
export const dealApi = {
  /**
   * Get all deals for a client (all statuses, not just active)
   */
  getClientDeals: async (clientId: string): Promise<Deal[]> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/deals?client_id=${clientId}`, {
      credentials: 'include',
    });
    const result = await handleResponse<{ success: boolean; data: { deals: Deal[] } }>(response);
    return result.data.deals;
  },
};

/**
 * Query keys for deal queries
 */
export const dealQueryKeys = {
  /** Base key for all deal queries */
  all: ['deals'] as const,

  /** Key for client deals */
  byClient: (clientId: string) => [...dealQueryKeys.all, 'client', clientId] as const,
};
