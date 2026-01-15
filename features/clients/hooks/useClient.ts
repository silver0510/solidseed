/**
 * useClient Hook
 *
 * Fetches and manages client data including documents, notes, and tasks.
 *
 * @module features/clients/hooks/useClient
 */

import { useState, useEffect, useCallback } from 'react';
import { clientApi, documentApi, noteApi, taskApi } from '../api/clientApi';
import type {
  ClientWithCounts,
  ClientDocument,
  ClientNote,
  ClientTask,
} from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useClient hook
 */
export interface UseClientOptions {
  /** ID of the client to fetch */
  clientId: string;
}

/**
 * Return value from the useClient hook
 */
export interface UseClientReturn {
  /** The client data with counts */
  client: ClientWithCounts | null;
  /** Array of client documents */
  documents: ClientDocument[];
  /** Array of client notes */
  notes: ClientNote[];
  /** Array of client tasks */
  tasks: ClientTask[];
  /** Whether any data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch all client data */
  refetch: () => Promise<void>;
  /** Refetch only documents */
  refetchDocuments: () => Promise<void>;
  /** Refetch only notes */
  refetchNotes: () => Promise<void>;
  /** Refetch only tasks */
  refetchTasks: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching and managing client data
 *
 * @example
 * ```tsx
 * const {
 *   client,
 *   documents,
 *   notes,
 *   tasks,
 *   isLoading,
 *   error,
 *   refetch
 * } = useClient({ clientId: 'cl123' });
 * ```
 */
export function useClient({ clientId }: UseClientOptions): UseClientReturn {
  const [client, setClient] = useState<ClientWithCounts | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client data
  const fetchClient = useCallback(async () => {
    try {
      const data = await clientApi.getClient(clientId);
      setClient(data);
      if (!data) {
        setError('Client not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client');
      setClient(null);
    }
  }, [clientId]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const data = await documentApi.getClientDocuments(clientId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setDocuments([]);
    }
  }, [clientId]);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      const data = await noteApi.getClientNotes(clientId);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setNotes([]);
    }
  }, [clientId]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskApi.getClientTasks(clientId);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    }
  }, [clientId]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    await Promise.all([
      fetchClient(),
      fetchDocuments(),
      fetchNotes(),
      fetchTasks(),
    ]);

    setIsLoading(false);
  }, [fetchClient, fetchDocuments, fetchNotes, fetchTasks]);

  // Initial fetch on mount and when clientId changes
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    client,
    documents,
    notes,
    tasks,
    isLoading,
    error,
    refetch: fetchAll,
    refetchDocuments: fetchDocuments,
    refetchNotes: fetchNotes,
    refetchTasks: fetchTasks,
  };
}

export default useClient;
